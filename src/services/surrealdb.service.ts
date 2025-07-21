import { Cookies } from '@/core/cookies';
import { JwtToken } from '@/core/jwt';
import type { User } from '@/core/types';
import { profile } from '@/main';
import { ConnectionStatus, Surreal, SurrealDbError, type RootAuth, type Token } from 'surrealdb';
import { ref, type App, type Ref } from 'vue';
import type { NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router';

const TOKEN_COOKIE = 'token'
const cookies = new Cookies()
let token = loadToken()
let loginRedirect: RouteLocationNormalized | undefined

export class SurrealDbService extends Surreal {

    private user: Ref<User | undefined> = ref()

    constructor(private router: Router) {
        super()
    }

    async signin(credentials: RootAuth): Promise<Token> {
        const jwt = new JwtToken(await super.signin({
            namespace: profile.namespace,
            database: profile.database,
            access: 'user',
            variables: credentials
        }))
        this.user.value = await super.info<User>()
        token = jwt
        cookies.set(TOKEN_COOKIE, jwt.raw, new Date((jwt.payload.exp || 0) * 1000))
        return jwt.raw
    }

    async signinAndRedirect(credentials: RootAuth) {
        await this.signin(credentials)
    }

    async redirectPostLogin(defaultRoute: string | RouteLocationNormalized = '/') {
        this.router.push(loginRedirect || defaultRoute)
        loginRedirect = undefined
    }

    async invalidate(): Promise<true> {
        this.user.value = undefined
        token = undefined
        cookies.delete(TOKEN_COOKIE)
        return await super.invalidate()
    }

    async invalidateAndRedirect(route: string | RouteLocationNormalized = '/') {
        await this.invalidate()
        this.router.push(route)
    }

    async authenticate(): Promise<true> {
        if (!token) return true
        const success = await super.authenticate(token.raw)
        if (success) {
            this.user.value = await super.info<User>()
        } else {
            token = undefined
            cookies.delete(TOKEN_COOKIE)
        }
        return success
    }

    getUser(): User | undefined {
        return this.user.value
    }
    
    getUserAsRef(): Ref<User | undefined> {
        return this.user
    }

    parseCustomSurrealDbError(exception: unknown): { key: string, success: boolean } {
        console.log(JSON.stringify(exception))
        const error = exception as SurrealDbError
        if (error?.name === 'ResponseError' && error.message) {
            const [prefix, message] = error.message.split('There was a problem with the database: An error occurred: ')
            const key = message ? message.split(':')[0] : undefined
            if (key) {
                return { key, success: true }
            } else {
                return { key: prefix, success: false }
            }
        } else if (error?.name === 'VersionRetrievalFailure') {
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

}

function loadToken(): JwtToken | undefined {
    const token = cookies.get(TOKEN_COOKIE)
    if (!token) return undefined
    const jwt = new JwtToken(token)
    if (jwt.isExpired()) {
        cookies.delete(TOKEN_COOKIE)
        return undefined
    }
    return jwt
}

function addSurrealInitializer(SurrealDbService: SurrealDbService): SurrealDbService {
    const isUninitialized = (surrealdb: SurrealDbService) => (surrealdb.status === ConnectionStatus.Disconnected || surrealdb.status === ConnectionStatus.Error)
    const initialize = async (surrealdb: SurrealDbService) => {
        for (let tries = 2; tries > 0 && isUninitialized(surrealdb); tries--) {
            await surrealdb.connect(profile.address, {
                namespace: profile.namespace,
                database: profile.database
            })
            await surrealdb.ready
            await surrealdb.authenticate()
        }
    }
    let connected: Promise<void> | null = null;
    return new Proxy(SurrealDbService, {
        get(target, property) {
            const original = target[property as keyof SurrealDbService]
            if (typeof original !== "function" || original.constructor.name !== "AsyncFunction") {
                return original
            }
            return async <T extends (...args: unknown[]) => unknown>(...args: Parameters<T>) => {
                if (original !== target.connect && isUninitialized(target)) {
                    if (!connected) connected = (async () => initialize(target))()
                    await connected                    
                }
                return (original as T).apply(target, args)
            }
        },
    })
}

export function auth(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
    if (!token && to.path !== '/login') {
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
        const surrealDbService = addSurrealInitializer(new SurrealDbService(router)) 
        app.config.globalProperties.$surrealDbService = surrealDbService
        app.provide(SURREAL_DB_SERVICE, surrealDbService)
    }
}