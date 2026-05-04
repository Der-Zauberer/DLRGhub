<template>

    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <ButtonComponent :to="{ name: 'plan-edit', params: { id: $route.params.id } }" color="ELEMENT" icon="settings" aria-label="Schicht bearbeiten"/>
        </HeadlineComponent>

        <div class="tabs" v-if="(plan.value && plan.value.clock) || !route.params.tab">
            <button :selected="!route.params.tab ? true : undefined" @click="router.push({ name: 'plan', params: { id: route.params.id } })">Schichten</button>
            <button :selected="route.params.tab === 'clocking' ? true : undefined" @click="router.push({ name: 'plan-tab', params: { id: route.params.id, tab: 'clocking' } })">Zeiten</button>
            <button :selected="route.params.tab === 'highscore' ? true : undefined" @click="router.push({ name: 'plan-tab', params: { id: route.params.id, tab: 'highscore' } })">Rangliste</button>
        </div>

        <OfflineComponent :loading="plan.loading" @reload="plan.reload()"/>
        <dlrg-empty v-if="plan?.status === 'EMPTY' || !plan.value?.shifts.length">Keine Schichten gefunden!</dlrg-empty>
        <dlrg-error v-if="plan?.status === 'ERROR' && parseCustomSurrealDbError(plan.error).key !== 'error.connection'">{{ plan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <div v-if="!route.params.tab">
            <ul class="grid-cols-xl-3 grid-cols-md-2 grid-cols-1" v-if="currentShifts?.length">
                <li v-for="shift of currentShifts">
                    <ShiftComponent :shift="shift" :roles="plan.value?.roles || []" :user="userNames.value || []" :userDisplayName="user.value?.displayname"/>
                </li>
            </ul>
            <HeadlineComponent title="Vergangene Wachen" v-if="previousShifts?.length && currentShifts?.length"/>
            <ul class="grid-cols-xl-3 grid-cols-md-2 grid-cols-1" v-if="previousShifts?.length">
                <li v-for="shift of previousShifts">
                    <ShiftComponent :shift="shift" :roles="plan.value?.roles || []" :user="userNames.value || []" :userDisplayName="user.value?.displayname"/>
                </li>
            </ul>
        </div>

        <div v-if="route.params.tab === 'clocking'">

            <div></div><HeadlineComponent title="Zeiterfassung"/>

            <form class="grid-cols-md-5 grid-cols-2" @submit.prevent="saveClocking()" v-if="plan.value && plan.value.clock">
                <swd-input class="grid-span-md-2 grid-span-1">
                    <label for="clocking-start">Beginn</label>
                    <input id="clocking-start" type="time" v-model="clocking.start" required>
                </swd-input>
                <swd-input class="grid-span-md-2 grid-span-1">
                    <label for="clocking-end">Ende</label>
                    <input id="clocking-end" type="time" v-model="clocking.end" required>
                </swd-input>
                <swd-loading-spinner class="grid-span-md-1 grid-span-2" :loading="clocking.loading"><button class="width-100">Speichern</button></swd-loading-spinner>
                <div v-if="clocking.error" class="grid-span-md-5 grid-span-2 red-text">{{ clocking.error }}</div>
            </form>

            <HeadlineComponent title="Verlauf"/>

            <div class="grid-cols-md-2 grid-cols-1" v-if="plan.value && plan.value.clock">
                <swd-card class="grid-cols-1">
                    <div class="flex flex-space-between">
                        <h4 class="margin-top-0">Zeiten Heute</h4>
                        <div>Gesammt {{ Math.floor(plan.value.clocking.today.map(entry => entry.end.getTime() - entry.start.getTime()).reduce((a, b) => a + b, 0) / HOURS) }}h</div>
                    </div>
                    <div class="clocking-today" v-for="today of plan.value.clocking.today">
                        <div>{{ today.user }}</div>
                        <div>{{ Math.floor((today.end.getTime() - today.start.getTime()) / HOURS) }}h {{ today.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }} - {{ today.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }}</div>
                    </div>
                </swd-card>
                <swd-card class="grid-cols-1">
                    <div class="flex flex-space-between">
                        <h4 class="margin-top-0">Meine Zeiten</h4>
                        <div>Gesammt {{ Math.floor(plan.value.clocking.user.map(entry => entry.end.getTime() - entry.start.getTime()).reduce((a, b) => a + b, 0) / HOURS) }}h</div>
                    </div>
                    <div class="clocking-user" v-for="user of plan.value.clocking.user">
                        <div>{{ user.start.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }) }} ({{ user.start.toLocaleString([], { weekday: 'short' }).slice(0, 2) }})</div>
                        <div>{{ Math.floor((user.end.getTime() - user.start.getTime()) / HOURS) }}h {{ user.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }} - {{ user.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }}</div>
                    </div>
                </swd-card>
            </div>

        </div>

        <div v-if="route.params.tab === 'highscore' && plan.value && plan.value.clock">
            <div></div><HeadlineComponent title="Rangliste">Gesammt {{ plan.value.clocking.highscore.map(entry => entry.hours).reduce((a, b) => a + b) }}h</HeadlineComponent>
            <div class="clocking-highscore">
                <div v-for="highscore of plan.value.clocking.highscore" class="highscore-bar">
                    <div class="highscore-bar__progress" :style="{ width: (highscore.hours / Math.max(...plan.value.clocking.highscore.map(h => h.hours))) * 100 + '%' }"></div>
                    <span>{{ highscore.user }}</span>
                    <span>{{ highscore.hours }}h</span>
                </div>
            </div>
        </div>

    </div>

</template>

<style scoped>

.tabs {
    display: flex;
    margin-bottom: var(--theme-element-spacing);
    
    & button {
        width: 100%;
        --theme-primary-color: var(--theme-element-primary-color);
        --theme-secondary-color: var(--theme-element-secondary-color);
    }

    & button:not(:first-child) {
        border-top-left-radius: 0; 
        border-bottom-left-radius: 0;
    }

    & button:not(:last-child) { 
        border-top-right-radius: 0; 
        border-bottom-right-radius: 0;
    }
    
}

.clocking-today {
    display: flex;
    justify-content: space-between;
}

.clocking-user {
    display: flex;
    justify-content: space-between;
}

.clocking-highscore {
    display: flex;
    flex-direction: column;
    gap: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-element-spacing);
}

.highscore-bar {
    display: flex;
    justify-content: space-between;
    position: relative;
    background: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);

    & .highscore-bar__progress {
        position: absolute;
        height: round(1.6em, 1px);
        background: var(--theme-primary-color);
        border-radius: var(--theme-border-radius);
    }

    & span {
        z-index: 1;
        font-weight: bold;
        padding: 0 1ch;
    }
}

.shifts {
    gap: var(--theme-border-width);
    padding: var(--theme-border-width);
    background-color: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.shifts li {
    cursor: pointer;
    font-size: 0.8em;
    --theme-inner-element-spacing: 1em;
    --theme-element-spacing: 1em;
    padding: var(--theme-inner-element-spacing);
    background: var(--theme-background-color);
}

.shifts li:focus-visible {
    outline: auto;
}

</style>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import ShiftComponent from '@/components/ShiftComponent.vue'
import { DATA_SERVICE, DataService } from '@/services/data.service'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql } from 'surrealdb'
import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const HOURS = 1000 * 60 * 60

const route = useRoute()
const router = useRouter()
const data = inject(DATA_SERVICE) as DataService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const userNames = data.getUserNames()
const user = data.getUser()

const plan = data.getPlan(new RecordId('plan', route.params.id), new Promise<void>(resolve => onBeforeUnmount(() => resolve())))
const currentShifts = computed(() => plan.value?.shifts.filter(shift => shift.date >= getYesterday()))
const previousShifts = computed(() => plan.value?.shifts.filter(shift => shift.date < getYesterday()))

const clocking = reactive<{ start?: string, end?: string, existing: boolean, loading: boolean, error?: string }>({ existing: false, loading: false, error: undefined })
watch(plan, () => {
    const now = new Date()
    const last = plan.value?.clocking?.user?.[0]
    if (plan.value?.clock && last && last.start.getFullYear() === now.getFullYear() && last.start.getMonth() === now.getMonth() && last.start.getDate() === now.getDate()) {
        if (!clocking.start) clocking.start = last.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
        if (!clocking.end) clocking.end = last.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    }
})

async function saveClocking() {
    clocking.error = undefined
    clocking.loading = true
    const [startHour, startMinute] = clocking.start!.split(':').map(number => Number(number))
    const start = new Date()
    start.setHours(startHour, startMinute, 0, 0)
    const [endHour, endMinute] = clocking.end!.split(':').map(number => Number(number))
    const end = new Date()
    end.setHours(endHour, endMinute, 0, 0)
    try {
        await surrealdb.query(surql`
            UPSERT clocking:[${plan.value!.id}, $auth.id, time::format(time::now(), "%Y-%m-%d")] CONTENT {
                user: $auth.id,
                start: ${start},
                end: ${end},
                plan: ${plan.value!.id}
            }
        `)
    } catch (exception) {
        clocking.error = parseCustomSurrealDbError(exception as Error).message
    } finally {
        clocking.loading = false
    }
}

function getYesterday(): Date {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
}

</script>