import type { User } from '@/core/types';
import { ConnectionStatus, ResponseError, Surreal, SurrealDbError, VersionRetrievalFailure, type ConnectOptions, type Token } from 'surrealdb';
import { ref, type App, type ComputedRef, type Ref } from 'vue';

import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router';

export const config: SurrealDbConfig = {
    default: {
        name: 'production',
        address: 'wss://derzauberer-06c3cc37l9t95bs5baeq4gtut8.aws-euw1.surreal.cloud',
        namespace: 'dlrg.derzauberer.eu',
        database: 'main',
        access: 'user'
    },
    profiles: [
        {
            name: 'production',
            address: 'wss://derzauberer-06c3cc37l9t95bs5baeq4gtut8.aws-euw1.surreal.cloud',
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
        this.header = JSON.parse(atob(header))
        this.payload = JSON.parse(atob(payload))
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

const PROFILE_COOKIE = 'surreal_db_profiles'
const TOKEN_COOKIE = 'surreal_db_token'
const cookies = new Cookies()
const profiles = loadProfiles()
let globalToken = loadToken()
let stopLogoutTimeout: () => void
let loginRedirect: RouteLocationNormalized | undefined

export class SurrealDbService extends Surreal {

    private user: Ref<User | undefined> = ref()

    constructor(private router: Router) {
        super()
    }

    async connect(url: string | URL, opts?: ConnectOptions, ignoreAuthentication?: boolean): Promise<true> {
        stopLogoutTimeout?.()
        const tryConnect = () => super.connect(url, opts).then(async response => (await this.ready, response))
        const response = tryConnect().catch(() => tryConnect())
        if (ignoreAuthentication) return response
        return response.then(() => this.authenticate().catch(() => true))
    }

    async autoConnect(configuration: SurrealDbProfile = profiles.default, ignoreAuthentication?: boolean) {
        profiles.default = configuration
        if (!profiles.profiles.find(profile => profile.name === configuration.name)) profiles.profiles.push(configuration)
        cookies.set(PROFILE_COOKIE, JSON.stringify(profiles))
        return this.connect(configuration.address, { namespace: configuration.namespace, database: configuration.database }, ignoreAuthentication)
    }

    async signin(credentials: { username: string, password: string }, configuration: SurrealDbProfile = profiles.default): Promise<Token> {
        if (configuration !== profiles.default) await this.autoConnect(configuration, true)
        const jwt = new JwtToken(await super.signin({
            namespace: configuration.namespace,
            database: configuration.database,
            access: configuration.access,
            variables: credentials
        }))
        this.user.value = await super.info<User>()
        globalToken = jwt
        const expiration = globalToken.getExpirationAsDate()
        if (expiration) cookies.set(`${TOKEN_COOKIE}_${configuration.name}`, globalToken.raw, expiration)
        profiles.default = configuration
        if (!profiles.profiles.find(profile => profile.name === configuration.name)) profiles.profiles.push(configuration)
        cookies.set(PROFILE_COOKIE, JSON.stringify(profiles))
        this.setLogoutTimeout()
        return jwt.raw
    }

    async redirectPostLogin(defaultRoute: string | RouteLocationNormalized = '/') {
        this.router.push(loginRedirect || defaultRoute)
        loginRedirect = undefined
    }

    async changePassword(credentials: PasswordChangeRequest): Promise<Token> {
        return await this.insert('_password_change_request', credentials).then(() => this.signin({ username: credentials.username , password: credentials.new }))
    }

    async authenticate(token?: string): Promise<true> {
        if (!token) token = cookies.get(`${TOKEN_COOKIE}_${profiles.default.name}`)
        if (!token) {
            globalToken = undefined
            throw new ResponseError('There was a problem with the database: There was a problem with authentication')
        }
        const jwt = new JwtToken(token)
        if (jwt.isExpired()) {
            globalToken = undefined
            cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
            throw new ResponseError('There was a problem with the database: There was a problem with authentication')
        }
        globalToken = jwt
        return await super.authenticate(globalToken.raw)
            .then(async result => {
                globalToken = jwt
                cookies.set(`${TOKEN_COOKIE}_${profiles.default.name}`, jwt.raw, jwt.getExpirationAsDate())
                this.setLogoutTimeout()
                this.user.value = await super.info<User>()
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

    async invalidate(): Promise<true> {
        this.user.value = undefined
        globalToken = undefined
        cookies.delete(`${TOKEN_COOKIE}_${profiles.default.name}`)
        stopLogoutTimeout?.()
        return await super.invalidate().then(() => (this.checkAuthGuard(this.router), true))
    }

    async redirectPostInvalidate(route: string | RouteLocationNormalized = '/') {
        this.router.push(route)
    }

    getUser(): User | undefined {
        return this.user.value ? Object.assign(this.user.value) : undefined
    }
    
    getUserAsRef(): ComputedRef<User | undefined> {
        return this.user as ComputedRef<User | undefined>
    }

    getProfile(): SurrealDbConfig {
        return Object.assign(profiles)
    }

    parseCustomSurrealDbError(exception: unknown): { key: string, success: boolean } {
        const error = exception as SurrealDbError
        if (error?.name === 'ResponseError' && error.message) {
            const [prefix, message] = error.message.split('There was a problem with the database: An error occurred: ')
            const key = message ? message.split(':')[0] : undefined
            if (key) {
                return { key, success: true }
            } else {
                return { key: prefix, success: false }
            }
        } else if (error?.name === 'VersionRetrievalFailure' || error?.name === 'ConnectionUnavailable') {
            return { key: 'error.connection', success: true }
        }
        return { key: error.toString(), success: false }
    }

    generateGUID(timebased?: boolean) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
        let guid = timebased ? Math.floor(Date.now() / 1000).toString(36) : ''
        for (let i = guid.length; i < 20; i++) guid += chars[Math.floor(Math.random() * chars.length)]
        return guid
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
            .find(guard => guard === auth)?.call(undefined, route, route, next)
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

function addTimeOut<T>(promise: Promise<T>, time: number): Promise<T> {
    return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new VersionRetrievalFailure(new Error("VersionRetrievalFailure: Failed to retrieve remote version. If the server is behind a proxy, make sure it's configured correctly."))), time))])
}

function addSurrealInitializer(SurrealDbService: SurrealDbService, timeout?: number): SurrealDbService {
    return new Proxy(SurrealDbService, {
        get(target, property) {
            const original = target[property as keyof SurrealDbService]
            if (typeof original !== 'function' || original.constructor.name !== 'AsyncFunction') {
                return original
            }
            return async <T extends (...args: unknown[]) => unknown>(...args: Parameters<T>) => {
                if (original !== target.connect && original !== target.autoConnect && (target.status === ConnectionStatus.Disconnected || target.status === ConnectionStatus.Error)) {
                    await target.autoConnect()
                }
                return timeout ? addTimeOut((original as T).apply(target, args) as Promise<unknown>, timeout) : (original as T).apply(target, args)
            }
        },
    })
}

export function auth(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
    if (globalToken?.isExpired()) globalToken = undefined
    if (!globalToken && to.path !== '/login') {
        loginRedirect = to
        next('/login')
    } else {
        next()
    }
}

export const SURREAL_DB_SERVICE = 'surrealDbService';

export default {
    install(app: App) {
        const router = app.config.globalProperties.$router
        const surrealDbService = addSurrealInitializer(new SurrealDbService(router), 7000)
        app.config.globalProperties.$surrealDbService = surrealDbService
        app.provide('surrealDbService', surrealDbService)
    }
}