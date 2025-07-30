import type { Plan, PlanScedulesShift, Shift, ShiftSecduledByPlan } from "@/core/types";
import { RecordId, surql } from "surrealdb";
import { ref, watch, type App } from "vue";
import type { SurrealDbService } from "./surrealdb.service";
import { resource } from "@/core/resource";
import SuperJSON from "superjson";

SuperJSON.registerCustom<RecordId, [string, any]>({
    isApplicable: (value): value is RecordId => value instanceof RecordId,
    serialize: (rid) => [rid.tb, rid.id],
    deserialize: ([tb, id]) => new RecordId(tb, id),
}, 'RecordId')

export class DataService {

    private readonly PROFILE_NAME = 'profile_name'
    private readonly CACHE_PLAN = 'plan'
    private readonly CACHE_PLAN_SCEDULES_SHIFT = 'plan->scedules->shift'
    private readonly CACHE_PERSON_SHIFT = 'person_shift'

    private readonly cache = new InMemoryDb()

    public readonly profileName = ref<string>('')

    constructor(private surrealDbService: SurrealDbService) {
        const name = localStorage.getItem(this.PROFILE_NAME)
        if (name && name.length !== 0) this.profileName.value = name
        watch(this.profileName, () => {
            console.log(this.profileName.value)
            localStorage.setItem(this.PROFILE_NAME, this.profileName.value)
        })
    }

    getPlans(kill: Promise<void>) {
        const table = this.CACHE_PLAN
        const cached = this.cache.get<Plan[]>(table, '*')

        const query = async (): Promise<Plan[]> => {
            const plans = await this.surrealDbService.select<Plan>(table)
            this.cache.set(table, '*', plans)
            const set = new Set(plans.map(plan => plan.id.id.toString()))
            this.cache.getAll<PlanScedulesShift>(this.CACHE_PLAN_SCEDULES_SHIFT)
                .filter(plan => !set.has(plan.id.id.toString()))
                .forEach(plan => this.cache.delete(this.CACHE_PLAN_SCEDULES_SHIFT, plan.id.id.toString()))
            return plans
        }

        const plan = resource({
            initializer: () => cached || query(),
            loader: () => query()
        })
        if (cached) plan.reload()

        const live = this.surrealDbService.live(table, async () => plan.reload(await query()))
        kill.then(() => live.then(id => this.surrealDbService.kill(id)))

        return plan
    }

    getPlan(id: RecordId<'plan'>, kill: Promise<void>) {
        const cached = this.cache.get<PlanScedulesShift>(this.CACHE_PLAN_SCEDULES_SHIFT, id.id.toString())

        const query = async (id: RecordId<'plan'>): Promise<PlanScedulesShift | undefined> => {
            const [plan] = await this.surrealDbService.query<[PlanScedulesShift]>(surql`SELECT *, (SELECT * FROM id->scedules->shift) as shifts FROM ONLY ${id};`)
            if (plan) this.cache.set(this.CACHE_PLAN_SCEDULES_SHIFT, plan.id.id.toString(), plan)
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

    getPersonShift(name: string, kill: Promise<void>) {
        const cached = this.cache.get<ShiftSecduledByPlan[]>(this.CACHE_PERSON_SHIFT, '*')

        const query = async (name: string): Promise<ShiftSecduledByPlan[] | undefined> => {
            const [shifts] = await this.surrealDbService.query<[ShiftSecduledByPlan[]]>(surql`SELECT *, (<-scedules<-plan)[0].* AS plan FROM shift WHERE people.map(|$person| $person.name).includes(${name});`)
            this.cache.set(this.CACHE_PERSON_SHIFT, '*', shifts)
            return shifts
        }

        const shifts = resource({
            initializer: () => cached || query(name),
            loader: () => query(name)
        })
        if (this.cache) shifts.reload()
        
        const liveShifts = this.surrealDbService.live('shift', async () => shifts.reload(await query(name)))
        kill.then(() => liveShifts.then((id) => this.surrealDbService.kill(id)))

        return shifts
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
        for (let key in this.tables) delete this.tables[key]
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