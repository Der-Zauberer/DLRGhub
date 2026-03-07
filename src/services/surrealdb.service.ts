import { resource, type Resource } from '@/core/resource'
import type { User } from '@/core/types'
import { DateTime, FileRef, Surreal, SurrealError, Table, type ConnectOptions, type DriverOptions, type Token, type Tokens, RecordId, type RecordIdValue } from 'surrealdb'
import { markRaw, type App } from 'vue'
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

export type SurrealDbAccount =  {
    id: string
    access: string
    refresh?: string
    expiration: number
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

/*
export class FakeRecordId<Tb extends string, Id extends RecordIdValue> {
    internal: { table: Table<Tb>, id: Id }

    constructor(table: Tb | Table<Tb>, id: Id) {
        this.internal = { table: typeof table === 'string' ? new Table(table) : table , id }
    }

	equals(other: unknown): boolean { return new RecordId(this.internal.table, this.internal.id).equals(other) }
	toJSON(): string { return new RecordId(this.internal.table, this.internal.id).toJSON() }
	toString(): string { return new RecordId(this.internal.table, this.internal.id).toString() }
	get table(): Table<Tb> { return this.internal.table }
	get id(): Id { return this.internal.id }

}
*/

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
        valueDecodeVisitor: (value) => {
            if (value instanceof DateTime) return new Date(value.toString())
            //if (value instanceof RecordId) return new FakeRecordId(value.table, value.id)
            return value instanceof RecordId || value instanceof FileRef ? markRaw(value) : value
        },
    }
}

const PROFILE_COOKIE = 'surreal_db_profiles'
const ACCOUNT_COOKIE = 'surreal_db_account'
const cookies = new Cookies()
const profiles = loadProfiles()
let account = loadAccount()
let stopLogoutTimeout: () => void
let loginRedirect: RouteLocationNormalized | undefined

const user = resource<User, unknown>({ loader: () => account && account.expiration > new Date().getTime() ? undefined : undefined })

export class SurrealDbService extends Surreal {

    private authReady = new Promise<Token | Tokens>((resolve, reject) => this.subscribe('auth', tokens => tokens ? resolve(tokens) : reject()))

    constructor(private router: Router) {
        super(DRIVER_OPTIONS)
    }

    async connect(url: string | URL, opts?: ConnectOptions, ignoreAuthentication?: boolean): Promise<true> {
        stopLogoutTimeout?.()
        const tryConnect = () => super.connect(url, { ...opts }).then(async response => (await this.ready, response))
        const response = tryConnect().catch(() => tryConnect())
        if (ignoreAuthentication) return response
        return response.then(() => (this.authenticate(), response))
    }

    async up(configuration: SurrealDbProfile = profiles.default, ignoreAuthentication?: boolean): Promise<true> {
        if (configuration === profiles.default && this.status !== 'disconnected') {
            await super.ready
            if (!ignoreAuthentication) await this.authReady
            return true
        }
        profiles.default = configuration
        if (!profiles.profiles.find(profile => profile.name === configuration.name)) profiles.profiles.push(configuration)
        cookies.set(PROFILE_COOKIE, JSON.stringify(profiles))
        return this.connect(configuration.address, { namespace: configuration.namespace, database: configuration.database }, ignoreAuthentication)
    }

    async signin(credentials: { username: string, password: string }, configuration: SurrealDbProfile = profiles.default): Promise<Tokens> {
        await this.up(profiles.default, true)
        if (configuration !== profiles.default) await this.up(configuration, true)
        const tokens = await super.signin({
            namespace: configuration.namespace,
            database: configuration.database,
            access: configuration.access,
            variables: credentials
        })
        const jwt = new JwtToken(typeof tokens === 'string' ? tokens : tokens.access)
        account = {
            id: '',
            access: jwt.raw,
            refresh: tokens.refresh,
            expiration: jwt.getExpirationAsDate()!.getTime()
        }
        cookies.set(`${ACCOUNT_COOKIE}_${profiles.default.name}`, JSON.stringify(account), jwt.getExpirationAsDate())
        this.setLogoutTimeout()
        user.reload(await super.auth<User>())
        const expiration = jwt.getExpirationAsDate()
        if (expiration) cookies.set(`${ACCOUNT_COOKIE}_${configuration.name}`, JSON.stringify(account), expiration)
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
        await this.up(profiles.default, true)
        return await this.insert(new Table('_password_change_request'), credentials).then(() => this.signin({ username: credentials.username , password: credentials.new }))
    }

    async authenticate(token?: Token | Tokens): Promise<Tokens> {
        await this.up(profiles.default, true)
        const tokens = token ? (typeof token === 'string' ? token : token.access) : account?.access
        if (!tokens) {
            account = undefined
            throw new SurrealError('There was a problem with authentication')
        }
        if (account && account.expiration < new Date().getTime()) {
            account = undefined
            cookies.set(`${ACCOUNT_COOKIE}_${profiles.default.name}`, JSON.stringify(account))
            throw new SurrealError('There was a problem with authentication')
        }
        return super.authenticate(tokens)
            .then(async result => {
                const jwt = new JwtToken(typeof result === 'string' ? result : result.access)
                account = {
                    id: '',
                    access: jwt.raw,
                    refresh: result.refresh,
                    expiration: jwt.getExpirationAsDate()!.getTime()
                }
                cookies.set(`${ACCOUNT_COOKIE}_${profiles.default.name}`, JSON.stringify(account), jwt.getExpirationAsDate())
                this.setLogoutTimeout()
                user.reload(await super.auth<User>())
                return result
            })
            .catch(error => {
                account = undefined
                cookies.delete(`${ACCOUNT_COOKIE}_${profiles.default.name}`)
                stopLogoutTimeout?.()
                this.checkAuthGuard(this.router)
                throw error
            })
    }

    async invalidate(): Promise<void> {
        user.reload()
        account = undefined
        cookies.delete(`${ACCOUNT_COOKIE}_${profiles.default.name}`)
        stopLogoutTimeout?.()
        this.authReady = new Promise<Token | Tokens>((resolve, reject) => this.subscribe('auth', tokens => tokens ? resolve(tokens) : reject()))
        return await super.invalidate().then(() => this.checkAuthGuard(this.router))
    }

    async invalidateAllDevices(): Promise<void> {
        return await this.insert(new Table('_invalidate_all_devices_request'), {}).then(() => this.invalidate())
    }

    async redirectPostInvalidate(route: string | RouteLocationNormalized = '/') {
        this.router.push(route)
    }

    getProfile(): SurrealDbConfig {
        return Object.assign(profiles)
    }

    getUser(): Resource<User, unknown> {
        return user
    }

    private setLogoutTimeout() {
        if (!account) return
        const timeout = setTimeout(() => this.invalidate(), Math.max(new Date(account.expiration).getTime() - Date.now(), 0))
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

function loadAccount(): SurrealDbAccount | undefined {
    const json = cookies.get(`${ACCOUNT_COOKIE}_${profiles.default.name}`)
    if (!json) return undefined
    const account = JSON.parse(json) as SurrealDbAccount | undefined
    if (!account) return undefined
    if (account.expiration < new Date().getTime()) {
        cookies.delete(`${ACCOUNT_COOKIE}_${profiles.default.name}`)
        return undefined
    }
    return account
}

export function auth(condition: (user: User) => boolean = () => true): NavigationGuardWithThis<undefined> {
    return (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        if (account && account.expiration < new Date().getTime()) account = undefined
        if (!account && to.path !== '/login') {
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
    if (['ThrownError', 'InternalError'].includes(error?.name) && error.message) {
        const [key, messages] = error.message.replace(/^.*An error occurred:\s*/, '').split(/:(.+)/)
        return { name: error.name, key: key?.trim() || error.message, message: messages?.trim() || error.message, success: true }
    } else if (error?.name === 'VersionRetrievalFailure' || error?.name === 'ConnectionUnavailable') {
        return { key: 'error.connection', message: error.message, success: true }
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