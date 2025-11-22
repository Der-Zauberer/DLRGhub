import type { Plan, PlanSchedulesShift, ShiftScheduledByPlan } from "@/core/types";
import { RecordId, surql } from "surrealdb";
import { ref, watch, type App } from "vue";
import type { SurrealDbService } from "./surrealdb.service";
import { resource, type Resource } from "@/core/resource";

export class DataService {

    private readonly ONLINE_EVENT = 'online'
    private readonly OFFLINE_EVENT = 'offline'

    private readonly PROFILE_NAME = 'profile_name'

    private readonly cache = new CacheDB('cache')
    public readonly online = ref<boolean>(navigator.onLine)
    public readonly profileName = ref<string>('')

    constructor(private surrealDbService: SurrealDbService) {
        window.addEventListener(this.ONLINE_EVENT,  () => (this.online.value = true, surrealDbService.autoConnect()))
        window.addEventListener(this.OFFLINE_EVENT, () => (this.online.value = false, surrealDbService.close()))
        const name = localStorage.getItem(this.PROFILE_NAME)
        if (name && name.length !== 0) this.profileName.value = name
        watch(this.profileName, () => {
            localStorage.setItem(this.PROFILE_NAME, this.profileName.value)
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

    clearCache() {
        this.cache.objectStore('readwrite', store => store.clear())
        localStorage.clear()
    }

    private createCachedResource<T>(cache: Promise<T>, query: () => Promise<T>, kill?: Promise<void>, trackedTables?: string[]): Resource<T, unknown> {
        const res = resource({
            initializer: async () => {
                const result = await cache
                if (result) setTimeout(() => res.reload(), 0)
                return result || query()
            },
            loader: () => query()
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