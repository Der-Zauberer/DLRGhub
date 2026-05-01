<template>

    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <ButtonComponent :to="{ name: 'plan-edit', params: { id: $route.params.id } }" color="ELEMENT" icon="settings" aria-label="Schicht bearbeiten"/>
        </HeadlineComponent>

        <div class="tabs" v-if="(plan.value && plan.value.clock) || tab !== 'SHIFTS'">
            <button :selected="tab === 'SHIFTS' ? true : undefined" @click="tab = 'SHIFTS'">Schichten</button>
            <button :selected="tab === 'CLOCKING' ? true : undefined" @click="tab = 'CLOCKING'">Zeiten</button>
            <button :selected="tab === 'HIGHSCORE' ? true : undefined" @click="tab = 'HIGHSCORE'">Rangliste</button>
        </div>

        <OfflineComponent :loading="plan.loading" @reload="plan.reload()"/>
        <dlrg-empty v-if="plan?.status === 'EMPTY' || !plan.value?.shifts.length">Keine Schichten gefunden!</dlrg-empty>
        <dlrg-error v-if="plan?.status === 'ERROR' && parseCustomSurrealDbError(plan.error).key !== 'error.connection'">{{ plan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <div v-if="tab === 'SHIFTS'">
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

        <div v-if="tab === 'CLOCKING'">

            <form class="flex" @submit.prevent="saveClocking()" v-if="plan.value && plan.value.clock">
                <input type="time" v-model="clocking.start" required>
                <input type="time" v-model="clocking.end" required>
                <swd-loading-spinner :loading="clocking.loading"><button>Speichern</button></swd-loading-spinner>
                <div v-if="clocking.error" class="red-text">{{ clocking.error }}</div>
            </form>

            <div class="grid-cols-md-2 grid-cols-1" v-if="plan.value && plan.value.clock">
                <div>
                    <h4 class="margin-top-0">Zeiten Heute</h4>
                    <div class="clocking-today" v-for="today of plan.value.clocking.today">
                        <div>{{ today.user.id.toString() }}</div>
                        <div>{{ today.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }} - {{ today.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }}</div>
                    </div>
                </div>
                <div>
                    <h4 class="margin-top-0">Meine Zeiten</h4>
                    <div class="clocking-user" v-for="user of plan.value.clocking.user">
                        <div>{{ user.start.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }) }}</div>
                        <div>{{ user.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }} - {{ user.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) }}</div>
                    </div>
                </div>
            </div>

        </div>

        <div v-if="tab === 'HIGHSCORE' && plan.value && plan.value.clock">
            <h4>Rangliste</h4>
            <div class="clocking-highscore">
                <div v-for="highscore of plan.value.clocking.highscore" class="highscore-bar">
                    <div class="highscore-bar__progress" :style="{ width: (highscore.hours / Math.max(...plan.value.clocking.highscore.map(h => h.hours))) * 100 + '%' }"></div>
                    <span>{{ highscore.user.id.toString() }}</span>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const userNames = data.getUserNames()
const user = data.getUser()
const tab = ref<'SHIFTS' | 'CLOCKING' | 'HIGHSCORE'>('SHIFTS')

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