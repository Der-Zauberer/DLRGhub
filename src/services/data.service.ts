import type { Plan, PlanSchedulesShift, ShiftScheduledByPlan } from "@/core/types";
import { RecordId, surql } from "surrealdb";
import { ref, watch, type App } from "vue";
import type { SurrealDbService } from "./surrealdb.service";
import { resource, type Resource } from "@/core/resource";
import SuperJSON from "superjson";

SuperJSON.registerCustom<RecordId, [string, string]>({
    isApplicable: (value): value is RecordId => value instanceof RecordId,
    serialize: (rid) => [rid.tb, rid.id.toString()],
    deserialize: ([tb, id]) => new RecordId(tb, id),
}, 'RecordId')

export class DataService {

    private readonly ONLINE_EVENT = 'online'
    private readonly OFFLINE_EVENT = 'offline'

    private readonly PROFILE_NAME = 'profile_name'
    private readonly CACHE_PLANS = 'plans'
    private readonly CACHE_PLAN = 'plan'
    private readonly CACHE_PLAN_Schedules_SHIFT = 'plan->schedules->shift'
    private readonly CACHE_PERSON_SHIFT = 'person_shift'

    private readonly cache = new InMemoryDb()
    private readonly cache2 = new CacheDB('cache')
    public readonly online = ref<boolean>(navigator.onLine)
    public readonly profileName = ref<string>('')

    constructor(private surrealDbService: SurrealDbService) {
        window.addEventListener(this.ONLINE_EVENT,  () => this.online.value = true)
        window.addEventListener(this.OFFLINE_EVENT, () => this.online.value = false)
        const name = localStorage.getItem(this.PROFILE_NAME)
        if (name && name.length !== 0) this.profileName.value = name
        watch(this.profileName, () => {
            console.log(this.profileName.value)
            localStorage.setItem(this.PROFILE_NAME, this.profileName.value)
        })
    }

    createCachedResource<T>(cache: Promise<T>, query: Promise<T>, kill?: Promise<void>, trackedTables?: string[]): Resource<T, unknown> {
        const res = resource({
            initializer: async () => {
                const result = await cache
                if (result) setTimeout(() => res.reload(), 0)
                return result || query
            },
            loader: () => query
        })
        if (kill) {
            const tables = trackedTables?.map(table => this.surrealDbService.live(table, () => res.reload()))
            const onlineEvent = () => res.reload()
            window.addEventListener(this.ONLINE_EVENT, onlineEvent)
            kill.then(() => {
                tables?.forEach(table => table.then((id) => this.surrealDbService.kill(id)))
                window.removeEventListener(this.ONLINE_EVENT, onlineEvent)
            })
        }
        return res
    }

    getPlans(kill?: Promise<void>) {
        const table = this.CACHE_PLAN
        const cached = this.cache.get<Plan[]>(table, '*')

        const query = async (): Promise<Plan[]> => {
            const plans = await this.surrealDbService.select<Plan>(table)
            this.cache.set(table, '*', plans)
            const set = new Set(plans.map(plan => plan.id.id.toString()))
            this.cache.getAll<PlanSchedulesShift>(this.CACHE_PLAN_Schedules_SHIFT)
                .filter(plan => !set.has(plan.id.id.toString()))
                .forEach(plan => this.cache.delete(this.CACHE_PLAN_Schedules_SHIFT, plan.id.id.toString()))
            return plans
        }

        const plan = resource({
            initializer: () => cached || query(),
            loader: () => query()
        })
        if (cached) plan.reload()

        if (kill) {
            const live = this.surrealDbService.live(table, async () => plan.reload(await query()))
            kill.then(() => live.then(id => this.surrealDbService.kill(id)))
        }

        return plan
    }

    getPlan2(id: RecordId<'plan'>, kill?: Promise<void>): Resource<PlanSchedulesShift | undefined, unknown> {
        const cached = this.cache2.objectStore<PlanSchedulesShift>('readonly', store => store.get([id.tb, id.id.toString()]))

        const query = async (id: RecordId<'plan'>): Promise<PlanSchedulesShift | undefined> => {
            const [plan] = await this.surrealDbService.query<[PlanSchedulesShift]>(surql`SELECT *, (SELECT * FROM id->schedules->shift ORDER BY date) as shifts FROM ONLY ${id};`)
            if (plan) this.cache2.objectStore('readwrite', store => store.put(plan))
            return plan
        }

        const plan = resource({
            initializer: async () => {
                const result = await cached
                if (result) setTimeout(() => plan.reload(), 0)
                return result || query(id)
            },
            loader: () => query(id)
        })
        
        if (kill) {
            const livePlans = this.surrealDbService.live('plan', () => plan.reload())
            const liveShifts = this.surrealDbService.live('shift', () => plan.reload())
            const onlineEvent = () => plan.reload()
            window.addEventListener(this.ONLINE_EVENT, onlineEvent)

            kill.then(() => {
                livePlans.then((id) => this.surrealDbService.kill(id))
                liveShifts.then((id) => this.surrealDbService.kill(id))
                window.removeEventListener(this.ONLINE_EVENT, onlineEvent)
            })
        }

        return plan
    }

    getPlan(id: RecordId<'plan'>, kill?: Promise<void>): Resource<PlanSchedulesShift | undefined, unknown> {
        const cache = this.cache2.objectStore<PlanSchedulesShift | undefined>('readonly', store => store.get([id.tb, id.id.toString()]))

        const query: Promise<PlanSchedulesShift | undefined> = (async () => {
            const [plan] = await this.surrealDbService.query<[PlanSchedulesShift]>(surql`SELECT *, (SELECT * FROM id->schedules->shift ORDER BY date) as shifts FROM ONLY ${id};`)
            if (plan) this.cache2.objectStore('readwrite', store => store.put(plan))
            return plan
        })()

        return this.createCachedResource<PlanSchedulesShift | undefined>(cache, query, kill, ['plan', 'shift'])
    }

    getPersonShift(name: string, kill?: Promise<void>) {
        const cached = this.cache.get<ShiftScheduledByPlan[]>(this.CACHE_PERSON_SHIFT, '*')

        const query = async (name: string): Promise<ShiftScheduledByPlan[] | undefined> => {
            const [shifts] = await this.surrealDbService.query<[ShiftScheduledByPlan[]]>(surql`SELECT *, (<-schedules<-plan)[0].* AS plan FROM shift WHERE people.map(|$person| $person.name).includes(${name}) ORDER BY date;`)
            this.cache.set(this.CACHE_PERSON_SHIFT, '*', shifts)
            return shifts
        }

        const shifts = resource({
            initializer: () => cached || query(name),
            loader: () => query(name)
        })
        if (this.cache) shifts.reload()
        
        if (kill) {
            const liveShifts = this.surrealDbService.live('shift', async () => shifts.reload(await query(name)))
            kill.then(() => liveShifts.then((id) => this.surrealDbService.kill(id)))
        }

        return shifts
    }

    async createPlan(name: string): Promise<Plan> {
        return (await this.surrealDbService.insert<Plan, { name: string }>('plan', { name }))[0]
    }

    async deletePlan(name: string) {
        //Delete references
        await this.surrealDbService.delete(new RecordId('plan', name))
    }

    async addShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people += ${person}`)
    }

    async removeShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people -= ${person}`)
    }

    clearCache() {
        this.cache.clear()
        localStorage.clear()
    }

}

class InMemoryDb {

    private readonly tables: Record<string, Map<string, object> | undefined> = {}

    constructor() {
        for (let index = 0; index < localStorage.length; index++) {
            const name = localStorage.key(index)
            if (!name) continue
            const split = name.split(':')
            if (split.length !== 2) continue
            const [table, id] = split
             try {
                const string = localStorage.getItem(name)
                if (!string) continue
                const value = SuperJSON.deserialize(JSON.parse(string)) as object
                this.set(table, id, value)
            } catch {
                continue
            }
        }
    }

    set<T extends object>(table: string, id: string, value: T): T {
        if (!this.tables[table]) this.tables[table] = new Map()
        this.tables[table].set(id, value)
        localStorage.setItem(`${table}:${id}`, JSON.stringify(SuperJSON.serialize(value)))
        return value
    }

    delete<T>(table: string, id: string): T | undefined {
        if (!this.tables[table]) return undefined
        const entry = this.tables[table].get(id)
        const result = entry ? this.tables[table].delete(id) as T : undefined
        if (this.tables[table].size === 0) delete this.tables[table]
        localStorage.removeItem(`${table}:${id}`)
        return result
    }

    deleteAll(table: string) {
        delete this.tables[table]
    }

    get<T>(table: string, id: string): T | undefined {
        if (!this.tables[table]) return undefined
        return this.tables[table].get(id) as T | undefined
    }

    getAll<T>(table: string): T[] {
        if (!this.tables[table]) return []
        return Array.from(this.tables[table].values() as MapIterator<T>)
    }

    clear() {
        for (const key in this.tables) delete this.tables[key]
    }
}

export class CacheDB {

    private readonly STORE = 'records'

    private db: Promise<IDBDatabase> | undefined

    constructor(name: string) {
        this.connect(name)
    }

    connect(name: string) {
        this.db = new Promise((resolve, reject) => {
            const request = indexedDB.open(name, 1)
            request.onupgradeneeded = () => {
                const store = request.result.createObjectStore(this.STORE, { keyPath: ['id.tb', 'id.id'] })
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
        const transaction = db.transaction(this.STORE, mode).objectStore(this.STORE)
        return new Promise((resolve, reject) => {
            const request = action(transaction)
            request.onsuccess = () => resolve(request.result as T)
            request.onerror = () => reject(request.error)
        })
    }

}

export function dateToISODate(date?: Date): string | undefined {
    return date ? date.toISOString().split('T')[0] : undefined
}

export function isoDateToDate(string?: string): Date | undefined {
    return string && string.match(/\d{4}-\d{2}-\d{2}/g) ? new Date(string) : undefined
}

export const DATA_SERVICE = 'dataService'

export default {
    install(app: App) {
        const surrealDbService = app.config.globalProperties.$surrealDbService
        const dataService = new DataService(surrealDbService)
        app.config.globalProperties.$dataService = dataService
        app.provide(DATA_SERVICE, dataService)
    }
}