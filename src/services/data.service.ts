import type { Plan, PlanSchedulesShift, Post, ShiftScheduledByPlan } from "@/core/types"
import { RecordId, surql, Uuid } from "surrealdb"
import { ref, watch, type App } from "vue"
import type { SurrealDbService } from "./surrealdb.service"
import { resource, type Resource } from "@/core/resource"
import type { WaterTemperature, Weather, WeatherService } from "./weather.service"

export class DataService {

    private readonly ONLINE_EVENT = 'online'
    private readonly OFFLINE_EVENT = 'offline'

    private readonly PROFILE_NAME = 'profile_name'

    public readonly online = ref<boolean>(navigator.onLine)
    private readonly onlineEvents = new Set<() => unknown>()
    private readonly cache = new CacheDB('cache')
    public readonly profileName = ref<string>('')

    constructor(private surrealDbService: SurrealDbService, private weatherService: WeatherService) {
        window.addEventListener(this.ONLINE_EVENT,  () => (this.online.value = true, this.reconnect()))
        window.addEventListener(this.OFFLINE_EVENT, () => (this.online.value = false, surrealDbService.close()))
        const name = localStorage.getItem(this.PROFILE_NAME)
        if (name && name.length !== 0) this.profileName.value = name
        watch(this.profileName, () => {
            localStorage.setItem(this.PROFILE_NAME, this.profileName.value)
        })
    }

    async reconnect(): Promise<true> {
        return this.surrealDbService.autoConnect().then((result) => {
            this.onlineEvents.forEach(event => event())
            return result
        })
    }

    getPlans(kill?: Promise<void>): Resource<Plan[], unknown> {
        const cache = this.cache.objectStore<{ value: Plan[] }>('readonly', store => store.get(['plans', '*'])).then(result => result?.value || [])

        const query = async (): Promise<Plan[]> => {
            const plans = await this.surrealDbService.select<Plan>('plan')
            this.cache.objectStore('readwrite', store => store.put({ id: new RecordId('plans', '*'), value: plans }))
            const set = new Set(plans.map(plan => plan.id.id.toString()))
            await this.cache.objectStore<PlanSchedulesShift[]>('readonly', store => store.index('table').getAll('plan')).then(result => 
                result.filter(plan => !set.has(plan.id.id.toString()))
                .forEach(plan => this.cache.objectStore('readwrite', store => store.delete([plan.id.tb, plan.id.id.toString()])))
            )
            return plans
        }

        return this.createCachedResource<Plan[]>(cache, query, kill, ['plan'])
    }

    getPlan(id: RecordId<'plan'>, kill?: Promise<void>): Resource<PlanSchedulesShift | undefined, unknown> {
        const cache = this.cache.objectStore<PlanSchedulesShift | undefined>('readonly', store => store.get([id.tb, id.id.toString()]))

        const query = async (): Promise<PlanSchedulesShift | undefined> => {
            const [plan] = await this.surrealDbService.query<[PlanSchedulesShift]>(surql`SELECT *, (SELECT * FROM id->schedules->shift ORDER BY date) as shifts FROM ONLY ${id};`)
            if (plan) this.cache.objectStore('readwrite', store => store.put(plan))
            return plan
        }

        return this.createCachedResource<PlanSchedulesShift | undefined>(cache, query, kill, ['plan', 'shift'])
    }

    getPersonShift(name: string, kill?: Promise<void>): Resource<ShiftScheduledByPlan[], unknown> {
        const cache = this.cache.objectStore<{ value: ShiftScheduledByPlan[] }>('readonly', store => store.get(['shifts', '*'])).then(result => result?.value || [])
        
        const query = async (): Promise<ShiftScheduledByPlan[]> => {
            const [shifts] = await this.surrealDbService.query<[ShiftScheduledByPlan[]]>(surql`SELECT *, (<-schedules<-plan)[0].* AS plan FROM shift WHERE people.map(|$person| $person.name).includes(${name}) AND date >= time::now() ORDER BY date;`)
            this.cache.objectStore('readwrite', store => store.put({ id: new RecordId('shifts', '*'), value: shifts }))
            return shifts
        }

        return this.createCachedResource<ShiftScheduledByPlan[]>(cache, query, kill, ['shift'])
    }

    getPosts(kill?: Promise<void>): Resource<Post[], unknown> {
        const cache = this.cache.objectStore<{ value: Post[] }>('readonly', store => store.get(['posts', '*'])).then(result => result?.value || [])

        const query = async (): Promise<Post[]> => {
            const posts = (await this.surrealDbService.select<Post>('post')).reverse()
            this.cache.objectStore('readwrite', store => store.put({ id: new RecordId('posts', '*'), value: posts }))
            return posts
        }

        return this.createCachedResource<Post[]>(cache, query, kill, ['post'])
    }

    async createPlan(name: string): Promise<Plan> {
        return (await this.surrealDbService.insert<Plan, { name: string }>('plan', { name }))[0]
    }

    async deletePlan(id: RecordId<'plan'>) {
        await this.surrealDbService.query(surql` DELETE ${id}->schedules->shift;`);
        await this.surrealDbService.delete(id)
    }

    async addShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people += ${person}`)
    }

    async removeShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people -= ${person}`)
    }
    
    async editDescription(shift: RecordId<'shift'>, description: string) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET description = ${description}`)
    }

    getWeather(): Resource<Weather, unknown> {
        const cache = this.cache.objectStore<Weather>('readonly', store => store.get(['weather', '*']))
        const query = async (): Promise<Weather> => {
            const result = await cache
            if (result && Date.now() - new Date(result.source.updated).getTime() < 60 * 60 * 1000) return result
            const weather = await this.weatherService.getWeather()
            this.cache.objectStore('readwrite', store => store.put({ id: new RecordId('weather', '*'), ...weather }))
            return weather
        }
        return this.createCachedResource<Weather>(cache, query)
    }

    getWaterTemperature(): Resource<WaterTemperature, unknown> {
        const cache = this.cache.objectStore<WaterTemperature>('readonly', store => store.get(['water', '*']))
        const query = async (): Promise<WaterTemperature> => {
            const result = await cache
            if (result && Date.now() - new Date(result.source.updated).getTime() < 60 * 60 * 1000) return result
            const water = await this.weatherService.getWaterTemperature()
            this.cache.objectStore('readwrite', store => store.put({ id: new RecordId('water', '*'), ...water }))
            return water
        }
        return this.createCachedResource<WaterTemperature>(cache, query)
    }

    clearCache() {
        this.cache.objectStore('readwrite', store => store.clear())
        localStorage.clear()
    }

    private createCachedResource<T>(cache: Promise<T>, query: () => Promise<T>, kill?: Promise<void>, trackedTables?: string[]): Resource<T, unknown> {
        let offline = true
        const tables: Promise<Uuid>[] = []
        const res = resource({
            initializer: async () => {
                const result = await cache
                if (result) setTimeout(() => res.reload(), 0)
                return result || query()
            },
            loader: () => query().then((result) => (setupLiveTables(), result))
        })
        const setupLiveTables = () => {
            if (offline && kill && trackedTables) {
                tables.length = 0
                tables.push(...trackedTables?.map(table => this.surrealDbService.live(table, (action, _) => {
                    if (action === 'CLOSE') offline = true
                    res.reload()
                })))
                offline = false
            }
        }
        if (kill) {
            setupLiveTables()
            const onlineEvent = () => res.reload()
            this.onlineEvents.add(onlineEvent)
            kill.then(() => {
                tables.forEach(table => table.then((id) => this.surrealDbService.kill(id)))
                this.onlineEvents.delete(onlineEvent)
            })
        }
        return res
    }

}

export class CacheDB {

    private db: Promise<IDBDatabase> | undefined

    constructor(name: string) {
        this.connect(name)
    }

    connect(name: string) {
        this.db = new Promise((resolve, reject) => {
            const request = indexedDB.open(name, 1)
            request.onupgradeneeded = () => {
                const store = request.result.createObjectStore('records', { keyPath: ['id.tb', 'id.id'] })
                store.createIndex('table', 'id.tb')
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async close(): Promise<void> {
        if (this.db) (await this.db).close()
        this.db = undefined
    }

    async objectStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
        if (!this.db) throw new DOMException("IDBDatabase.transaction: Can't start a transaction on a closed database", "InvalidStateError")
        const db = await this.db
        const transaction = db.transaction('records', mode).objectStore('records')
        return new Promise((resolve, reject) => {
            const request = action(transaction)
            request.onsuccess = () => resolve(request.result as T)
            request.onerror = () => reject(request.error)
        })
    }

}

export function dateToIsoDate(date?: Date): string | undefined {
    return date ? date.toISOString().split('T')[0] : undefined
}

export function isoDateToDate(string?: string): Date | undefined {
    return string && string.match(/\d{4}-\d{2}-\d{2}/g) ? new Date(string) : undefined
}

export const DATA_SERVICE = 'dataService'

export default {
    install(app: App) {
        const surrealDbService = app.config.globalProperties.$surrealDbService
        const weatherService = app.config.globalProperties.$weatherService
        const dataService = new DataService(surrealDbService, weatherService)
        app.config.globalProperties.$dataService = dataService
        app.provide(DATA_SERVICE, dataService)
    }
}