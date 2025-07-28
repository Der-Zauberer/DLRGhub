import type { Plan, PlanScedulesShift, Shift } from "@/core/types";
import { RecordId, surql } from "surrealdb";
import { type App } from "vue";
import type { SurrealDbService } from "./surrealdb.service";
import { resource } from "@/core/resource";
import SuperJSON from "superjson";

SuperJSON.registerCustom<RecordId, [string, any]>({
    isApplicable: (value): value is RecordId => value instanceof RecordId,
    serialize: (rid) => [rid.tb, rid.id],
    deserialize: ([tb, id]) => new RecordId(tb, id),
}, 'RecordId')

export class DataService {

    private readonly cache = new InMemoryDb()

    constructor(private surrealDbService: SurrealDbService) {}

    getPlans(kill: Promise<void>) {
        const cached = this.cache.getAll<Plan>('plan')

        const query = async (): Promise<Plan[]> => {
            const plans = await this.surrealDbService.select<Plan>('plan')
            this.cache.deleteAll('plan')
            plans.forEach(plan => this.cache.set(plan.id.tb, plan.id.id.toString(), plan))
            return plans
        }

        const plan = resource({
            initializer: () => cached.length !== 0 ? cached : query(),
            loader: () => query()
        })
        if (cached) plan.reload()

        const live = this.surrealDbService.live('plan', async () => plan.reload(await query()))
        kill.then(() => live.then(id => this.surrealDbService.kill(id)))

        return plan
    }

    getPlan(id: RecordId<'plan'>, kill: Promise<void>) {
        const cached = this.cache.get<PlanScedulesShift>(id.tb, id.id.toString())
        if (cached) cached.shifts = this.cache.get<Shift[]>('plan->scedules->shift', id.id.toString()) || []

        const query = async (id: RecordId<'plan'>): Promise<PlanScedulesShift | undefined> => {
            const [plan, shifts] = await this.surrealDbService.query<[PlanScedulesShift, Shift[]]>(surql`SELECT * FROM ONLY ${id}; SELECT * FROM ${id}->scedules->shift;`)
            if (plan) this.cache.set(id.tb, id.id.toString(), plan)
            if (shifts) this.cache.set('plan->scedules->shift', id.id.toString(), shifts)
            if (plan) plan.shifts = shifts
            return plan
        }

        const plan = resource({
            initializer: () => cached || query(id),
            loader: () => query(id)
        })
        if (this.cache) plan.reload()
        
        const livePlans = this.surrealDbService.live('plan', async () => plan.reload(await query(id)))
        const liveShifts = this.surrealDbService.live('shift', async () => plan.reload(await query(id)))

        kill.then(() => {
            livePlans.then((id) => this.surrealDbService.kill(id))
            liveShifts.then((id) => this.surrealDbService.kill(id))
        })

        return plan
    }

    async addShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people += ${person}`)
    }

    async removeShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people -= ${person}`)
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