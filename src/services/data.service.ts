import type { ShiftPlan } from "@/core/types";
import { RecordId } from "surrealdb";
import type { App } from "vue";

export class DataService {

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

export default {
    install(app: App) {
        const dataService = new DataService() 
        app.config.globalProperties.$dataService = dataService
        app.provide('dataService', dataService)
    }
}