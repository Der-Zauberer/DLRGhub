import type { Plan, Shift } from "@/core/types";
import { RecordId, surql } from "surrealdb";
import { type App } from "vue";
import type { SurrealDbService } from "./surrealdb.service";

export class DataService {

    constructor(private surrealDbService: SurrealDbService) {}

    async getPlans(): Promise<Plan[]> {
        return this.surrealDbService.select<Plan>('plan')
    }

    async getPlan(id: RecordId<'plan'>): Promise<{ plan: Plan, shifts: Shift[] } | undefined> {
        const [plan, shifts] = await this.surrealDbService.query<[Plan, Shift[]]>(surql`SELECT * FROM ONLY ${id}; SELECT * FROM ${id}->scedules->shift;`)
        return plan ? { plan, shifts } : undefined
    }

    async addShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people += ${person}`)
    }

    async removeShiftPerson(shift: RecordId<'shift'>, person: { name: string, role?: string }) {
        await this.surrealDbService.query(surql`UPDATE ${shift} SET people -= ${person}`)
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