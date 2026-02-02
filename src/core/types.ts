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
    description?: string
    people: {
        name: string
        role: string
    }[]
}

export type PlanSchedulesShift = Plan & {
    shifts: Shift[]
}

export type ShiftScheduledByPlan = Shift & {
    plan: Plan
}

export type Post = {
    id: RecordId<'post'>
    title: string
    author: string
    message: string
    created: Date
    updated: Date
}

export type BinaryFile = {
    id: RecordId<'file'>
    name: string
    type: string
    content: ArrayBuffer
    created: {
        user: RecordId<'user'>
        timestamp: Date
    },
    updated: {
        user: RecordId<'user'>
        timestamp: Date
    }
}

export type User = {
    id: RecordId<'user'>
    email: string
    name: string
    displayname: string
    password?: string
    admin: boolean
    account: {
        enabled: boolean
        expiry?: Date
        valid?: Date
    }
    credentials: {
        change: boolean
        expiry?: Date
    }
    login?: Date
}

export type Registration = {
    id: RecordId<'registration'>
    email: string
    firstname: string
    lastname: string
    password: string
    approve: boolean
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ 
    outcome: 'accepted' | 'dismissed' 
    platform: string 
  }>
}