import type { User } from '@/core/types'
import { DateTime, FileRef, RecordId, surql, Surreal, SurrealError, Table, type ConnectOptions, type DriverOptions, type Token, type Tokens } from 'surrealdb'
import { markRaw, ref, type App, type ComputedRef, type Ref } from 'vue'
import type { NavigationGuardNext, NavigationGuardWithThis, RouteLocationNormalized, Router } from 'vue-router'

export const config: SurrealDbConfig = {
    default: {
        name: 'production',
        address: 'wss://derzauberer-06e7dvdgsls9d6i12vddn1d5u0.aws-euw1.surreal.cloud',
        namespace: 'dlrg.derzauberer.eu',
        database: 'main',
        access: 'user'
    },
    profiles: [
        {
            name: 'production',
            address: 'wss://derzauberer-06e7dvdgsls9d6i12vddn1d5u0.aws-euw1.surreal.cloud',
            namespace: 'dlrg.derzauberer.eu',
            database: 'main',
            access: 'user'
        },
        {
            name: 'local',
            address: 'ws://localhost:8080/rpc',
            namespace: 'dlrg.derzauberer.eu',
            database: 'develop',
            access: 'user'
        }
    ]
}

export type SurrealDbProfile = {
    name: string,
    address: string,
    namespace: string,
    database: string,
    access: string
}

export type SurrealDbConfig = {
    default: SurrealDbProfile,
    profiles: SurrealDbProfile[]
}

export type PasswordChangeRequest = {
    username: string
    old: string
    new: string
    repeat: string
}

export class JwtToken {
    header: {
        typ: string,
        alg: string
    }
    payload: {
        jit?: string,
        iss?: string,
        sub?: string,
        exp?: number,
        iat?: number,
        nbf?: number,
        [key: string]: unknown,
    }
    signature: string
    raw: string

    constructor(token: string) {
        const [header, payload, signature] = token.split('.')
        this.header = JSON.parse(atob(header.replace(/-/g, '+').replace(/_/g, '/')))
        this.payload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        this.signature = signature
        this.raw = token
    }

    isExpired(): boolean {
        return !this.payload.exp || this.payload.exp * 1000 < new Date().getTime()
    }

    getExpirationAsDate(): Date | undefined {
        return this.payload.exp ? new Date(this.payload.exp * 1000) : undefined
    }
}

export class Cookies {
    
    private readonly cookies: Map<string, string> = new Map()

    constructor() {
        for (const cookie of document.cookie.split('; ')) {
            const [name, value] = cookie.split('=');
            this.cookies.set(name, decodeURIComponent(value || ''));
        }
    }

    get(name: string): string | undefined {
        return this.cookies.get(name)
    }

    getAll(): Map<string, string> {
        return new Map(this.cookies)
    }

    set(name: string, value: string, date?: Date) {
        if (!date) {
            date = new Date()
            date.setDate(date.getDate() + 400)
        }
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`
        this.cookies.set(name, value)
    }

    delete(name: string) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
        this.cookies.delete(name)
    }

}

const DRIVER_OPTIONS: DriverOptions = {
    codecOptions: {
        valueDecodeVisitor: (value) => value instanceof RecordId || value instanceof DateTime || value instanceof FileRef ? markRaw(value) : value,
    }
}

const PROFILE_COOKIE = 'surreal_db_profiles'
const TOKEN_COOKIE = 'surreal_db_token'
const cookies = new Cookies()
const profiles = loadProfiles()
const user: Ref<User | undefined> = ref()
let globalToken = loadToken()
let stopLogoutTimeout: () => void
let loginRedirect: RouteLocationNormalized | undefined

export class SurrealDbService extends Surreal {

    constructor(private router: Router) {
        super(DRIVER_OPTIONS)
    }

    async connect(url: string | URL, opts?: ConnectOptions, ignoreAuthentication?: boolean): Promise<true> {
        stopLogoutTimeout?.()
        const tryConnect = () => super.connect(url, { ...opts }).then(async response => (await this.ready, response))
        const response = tryConnect().catch(() => tryConnect())
        if (ignoreAuthentication) return response
        return response.then(() => (this.authenticate(), true))
    }

    async autoConnect(configuration: SurrealDbProfile = profiles.default, ignoreAuthentication?: boolean): Promise<true> {
        if (configuration === profiles.default && this.status !== 'disconnected') {
            await super.ready
            return true
        }
        profiles.default = configuration
        if (!profiles.profiles.find(profile => profile.name === configuration.name)) profiles.profiles.push(configuration)
        cookies.set(PROFILE_COOKIE, JSON.stringify(profiles))
        return this.connect(configuration.address, { namespace: configuration.namespace, database: configuration.database }, ignoreAuthentication)
    }

    async signin(credentials: { username: string, password: string }, configuration: SurrealDbProfile = profiles.default): Promise<Tokens> {
        if (configuration !== profiles.default) await this.autoConnect(configuration, true)
        const tokens = await super.signin({
            namespace: configuration.namespace,
            database: configuration.database,
            access: configuration.access,
            variables: credentials
        })
        const jwt = new JwtToken(tokens.access)
        user.value = await super.query<[User]>(surql`session::rd()`).then(result => result[0])
        globalToken = jwt
        const expiration = globalToken.getExpirationAsDate()
        if (expiration) cookies.set(`${TOKEN_COOKIE}_${configuration.name}`, globalToken.raw, expiration)
        profiles.default = configuration
        if (!profiles.profiles.find(profile => profile.name === configuration.name)) profiles.profiles.push(configuration)
        cookies.set(PROFILE_COOKIE, JSON.stringify(profiles))
        this.setLogoutTimeout()
        return tokens
    }

    async redirectPostLogin(defaultRoute: string | RouteLocationNormalized = '/') {
        this.router.push(loginRedirect || defaultRoute)
        loginRedirect = undefined
    }

    async changePassword(credentials: PasswordChangeRequest): Promise<Tokens> {
        return await this.insert(new Table('_password_change_request'), {}).then(() => this.signin({ username: credentials.username , password: credentials.new }))
    }

    async authenticate(token?: Token | Tokens): Promise<Tokens> {
        const tokens = token ? (typeof token === 'string' ? token : token.access) : cookies.get(`${TOKEN_COOKIE}_${profiles.default.name}`) as string
        if (!tokens) {
            globalToken = undefined
            throw new SurrealError('There was a problem with authentication')
        }
        const jwt = new JwtToken(tokens)
        if (jwt.isExpired()) {
            globalToken = undefined
            cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
            throw new SurrealError('There was a problem with authentication')
        }
        globalToken = jwt
        return super.authenticate(globalToken.raw)
            .then(async result => {
                globalToken = jwt
                cookies.set(`${TOKEN_COOKIE}_${profiles.default.name}`, jwt.raw, jwt.getExpirationAsDate())
                this.setLogoutTimeout()
                //user.value = await super.query<[User]>(surql`session::rd()`).then(result => result[0])
                return result
            })
            .catch(error => {
                globalToken = undefined
                cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
                stopLogoutTimeout?.()
                this.checkAuthGuard(this.router)
                throw error
            })
    }

    async invalidate(): Promise<void> {
        user.value = undefined
        globalToken = undefined
        cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
        stopLogoutTimeout?.()
        return await super.invalidate().then(() => this.checkAuthGuard(this.router))
    }

    async invalidateAllDevices(): Promise<void> {
        return await this.insert(new Table('_invalidate_all_devices_request'), {}).then(() => this.invalidate())
    }

    async redirectPostInvalidate(route: string | RouteLocationNormalized = '/') {
        this.router.push(route)
    }

    getUser(): User | undefined {
        return user.value ? Object.assign(user.value) : undefined
    }
    
    getUserAsRef(): ComputedRef<User | undefined> {
        return user as ComputedRef<User | undefined>
    }

    getProfile(): SurrealDbConfig {
        return Object.assign(profiles)
    }

    private setLogoutTimeout() {
        if (!globalToken || !globalToken.payload?.exp) return
        const timeout = setTimeout(() => this.invalidate(), Math.max((globalToken?.payload?.exp || 0) * 1000 - Date.now(), 0))
        stopLogoutTimeout = () => clearTimeout(timeout)
    }

    private checkAuthGuard(router: Router) {
        const route = router.currentRoute.value
        const next: NavigationGuardNext = (location?: unknown) => {
            if (location && (typeof location === 'string' || typeof location === 'object')) router.push(location)
        }
        (Array.isArray(route.matched[0].beforeEnter) ? route.matched[0].beforeEnter : [route.matched[0].beforeEnter])
            .filter(guard => !!guard)
            .forEach(guard => guard.call(undefined, route, route, next))
    }

}

function loadProfiles(): SurrealDbConfig {
    const json = cookies.get(PROFILE_COOKIE)
    if (!json) return { default: config.default, profiles: [ config.default ] }
    return JSON.parse(json) as SurrealDbConfig
}

function loadToken(): JwtToken | undefined {
    const token = cookies.get(`${TOKEN_COOKIE}_${profiles.default.name}`)
    if (!token) return undefined
    const jwt = new JwtToken(token)
    if (jwt.isExpired()) {
        cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
        return undefined
    }
    return jwt
}

function addSurrealInitializer(SurrealDbService: SurrealDbService, timeout?: number): SurrealDbService {
    return new Proxy(SurrealDbService, {
        get(target, property) {
            const original = target[property as keyof SurrealDbService]
            if (typeof original !== 'function' || original.constructor.name !== 'AsyncFunction') {
                return original
            }
            return async <T extends (...args: unknown[]) => unknown>(...args: Parameters<T>) => {
                if (original !== target.connect && original !== target.autoConnect && target.status === 'disconnected') await target.autoConnect()
                return (original as T).apply(target, args)
            }
        },
    })
}

export function auth(condition: (user: User) => boolean = () => true): NavigationGuardWithThis<undefined> {
    return (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        if (globalToken?.isExpired()) globalToken = undefined
        if (!globalToken && to.path !== '/login') {
            loginRedirect = to
            next('/login')
        } else if (user.value && !condition(user.value)) {
            next(false)
        } else {
            next()
        }
    }
}

export function parseCustomSurrealDbError(exception: Error | undefined): { name?: string, key?: string, message?: string, success: boolean } {
    if (!exception) return { success: false }
    const error = exception as SurrealError
    if (error?.name === 'ResponseError' && error.message) {
        const [prefix, message] = error.message.split('There was a problem with the database: An error occurred: ')
        const key = message ? message.split(':') : undefined
        return { name: error?.name, key: key && key[0] || prefix, message: key && key[1], success: false }
    } else if (error?.name === 'VersionRetrievalFailure' || error?.name === 'ConnectionUnavailable') {
        return { key: 'error.connection', success: true }
    }
    return { key: error.toString(), success: false }
}

export function generateGUID(timebased?: boolean) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    let guid = timebased ? Math.floor(Date.now() / 1000).toString(36) : ''
    for (let i = guid.length; i < 20; i++) guid += chars[Math.floor(Math.random() * chars.length)]
    return guid
}

export function normalize(name: string, seperator?: string): string {
    let normalized: string = ''
    let blank: boolean = false
    const replacements: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }
    for (let char of name.toLowerCase()) {
        if (replacements[char]) {
            normalized += replacements[char]
            blank = false
        } else if (char === ' ' || char === '/' || char === '-') {
            if (!blank) {
                if (seperator) normalized += seperator;
                blank = true
            }
        } else if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
            normalized += char
            blank = false
        } else {
            for (let nkd of char.normalize('NFD')) {
                if (nkd <= '\u007F') {
                    normalized += nkd
                }
            }   
        }
    }
    return normalized
}

export const SURREAL_DB_SERVICE = 'surrealDbService'

export default {
    install(app: App) {
        const router = app.config.globalProperties.$router
        const surrealDbService = new SurrealDbService(router)
        app.config.globalProperties.$surrealDbService = surrealDbService
        app.provide('surrealDbService', surrealDbService)
    }
}