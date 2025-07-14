import type { RecordId } from "surrealdb"

export type ShiftPlan = {
    id: RecordId<'shift_plan'>
    name: string
    shifts: {
        name: string
        date: Date
        startTime?: string
        endTime?: string
    }[]
    roles: string[]
    people: {
        firstName: string
        lastName: string
    }[]
}