<template>

    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <ButtonComponent :to="{ name: 'plan-edit', params: { id: $route.params.id } }" color="ELEMENT" icon="settings" aria-label="Schicht bearbeiten"/>
        </HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(plan.error).key === 'error.connection'" :loading="plan.loading" @reload="plan.reload()"/>
        <dlrg-empty v-if="plan?.status === 'EMPTY' || !plan.value?.shifts.length">Keine Schichten gefunden!</dlrg-empty>
        <dlrg-error v-if="plan?.status === 'ERROR' && parseCustomSurrealDbError(plan.error).key !== 'error.connection'">{{ plan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <ul class="grid-cols-xl-3 grid-cols-md-2 grid-cols-1" v-if="currentShifts?.length">
            <li v-for="shift of currentShifts">
                <ShiftComponent :shift="shift" :roles="plan.value?.roles || []"/>
            </li>
        </ul>

        <HeadlineComponent title="Vergangene Wachen" v-if="previousShifts?.length && currentShifts?.length"/>
        <ul class="grid-cols-xl-3 grid-cols-md-2 grid-cols-1" v-if="previousShifts?.length">
            <li v-for="shift of previousShifts">
                <ShiftComponent :shift="shift" :roles="plan.value?.roles || []"/>
            </li>
        </ul>

    </div>

</template>

<style scoped>

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
import { parseCustomSurrealDbError } from '@/services/surrealdb.service'
import { RecordId } from 'surrealdb'
import { computed, inject, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const plan = data.getPlan(new RecordId('plan', route.params.id), new Promise<void>(resolve => onBeforeUnmount(() => resolve())))
const currentShifts = computed(() => plan.value?.shifts.filter(shift => shift.date >= new Date()))
const previousShifts = computed(() => plan.value?.shifts.filter(shift => shift.date < new Date()))

</script>