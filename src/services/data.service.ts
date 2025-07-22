import type { Plan, Shift, ShiftPlan } from "@/core/types";
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

    getShiftPlans(): ShiftPlan[] {
        return [
            {
                id: new RecordId('shift_plan', '0'),
                name: 'Wache 2025',
                shifts: [
                    { name: 'SA', date: new Date('2025-07-19') },
                    { name: 'SO', date: new Date('2025-07-20') },
                    { name: 'SA', date: new Date('2025-07-26') },
                    { name: 'SO', date: new Date('2025-07-27') },
                    { name: 'SA', date: new Date('2025-08-02') },
                    { name: 'SO', date: new Date('2025-08-03') }
                ],
                roles: [
                    'Wachleiter',
                    'Sanitäter',
                    'Wachgänger'
                ],
                people: [
                    { firstName: 'Herbert', lastName: 'Groß' },
                    { firstName: 'Frederik', lastName: 'Hubert' },
                    { firstName: 'Dominik', lastName: 'Schneble' },
                    { firstName: 'Emely', lastName: 'Schwarz' },
                    { firstName: 'Laura', lastName: 'Wälder' },
                ]
            },
            {
                id: new RecordId('shift_plan', '1'),
                name: 'Beachbar',
                shifts: [
                    { name: 'Aufbau', date: new Date('2025-07-31') },
                    { name: 'Ausschank', date: new Date('2025-08-01') },
                    { name: 'Abbau', date: new Date('2025-08-02') },
                ],
                roles: [],
                people: [
                    { firstName: 'Herbert', lastName: 'Groß' },
                    { firstName: 'Frederik', lastName: 'Hubert' },
                    { firstName: 'Dominik', lastName: 'Schneble' },
                    { firstName: 'Emely', lastName: 'Schwarz' },
                    { firstName: 'Laura', lastName: 'Wälder' },
                ]
            },
        ]
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