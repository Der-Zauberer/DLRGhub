<template>

    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <ButtonComponent :to="{ name: 'shift-edit', params: { id: $route.params.id } }" color="ELEMENT" icon="settings" aria-label="Schicht bearbeiten"/>
        </HeadlineComponent>

        <dlrg-empty v-if="plan?.status === 'EMPTY' || !plan.value?.shifts.length">Keine Schichten gefunden!</dlrg-empty>
        <dlrg-error v-if="plan?.status === 'ERROR'">{{ plan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <ul class="grid-cols-xl-4 grid-cols-lg-3 grid-cols-md-2 grid-cols-sm-1 grid-cols-1">
            <li v-for="shift of plan.value?.shifts" :key="shift.id.id.toString()">
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
import ButtonComponent from '@/components/ButtonComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import ShiftComponent from '@/components/ShiftComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { RecordId } from 'surrealdb';
import { inject, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const plan = data.getPlan(new RecordId('plan', route.params.id), new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

</script>