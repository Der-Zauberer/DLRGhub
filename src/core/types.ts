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

export type Plan = {
    id: RecordId<'plan'>
    name: string
    roles: string[]
}

export type Shift = {
    id: RecordId<'shift'>
    name?: string
    date: Date
    begin?: string
    end?: string
    people: {
        name: string
        role: string
    }[]
}

export type PlanScedulesShift = Plan & {
    shifts: Shift[]
}

export type ShiftSecduledByPlan = Shift & {
    plan: Plan
}

export type User = {
    id: RecordId<'user'>
    password: string
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ 
    outcome: 'accepted' | 'dismissed' 
    platform: string 
  }>
}