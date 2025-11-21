<template>

    <RouterLink :to="{ name: 'plan', params: { id: shift.id.id.toString() } }" class="shift">
        <swd-card class="shift__date">
            <div><b>{{ shift.date.toLocaleString([], { weekday: 'short' }).slice(0, 2).toUpperCase() }}</b></div>
            <div>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) }}</div>
        </swd-card>
        <swd-card class="shift__info">
            <div>{{ shift.name || shift.plan.name }}
                <swd-subtitle>
                    <span v-if="shift.begin">{{ shift.begin + (shift.end ? ' - ' + shift.end : '') + ' &bull; ' }}</span><span>{{ shift.plan.name }}</span>
                </swd-subtitle>
            </div>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </swd-card>
    </RouterLink>

</template>

<style scoped>

.shift {
    display: flex;
    text-decoration: none;
    gap: 0;
}

.shift:hover .shift__info, .shift:focus .shift__info, .shift:active .shift__info {
    background: var(--theme-secondary-grey-color);
}

.shift swd-card {
    height: auto;
    padding: calc(round(.5em,1px) - var(--theme-border-width)) calc(round(1em,1px) - var(--theme-border-width));
    margin-bottom: 0;
}

.shift .shift__date {
    text-align: center;
    background: var(--theme-secondary-grey-color);
    border-radius: var(--theme-border-radius) 0 0 var(--theme-border-radius);
}

.shift .shift__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: calc(round(.6em,1px) - var(--theme-border-width)) !important;
    width: 100%;
    border-radius: 0 var(--theme-border-radius) var(--theme-border-radius) 0;
}

</style>

<script setup lang="ts">
import type { ShiftScheduledByPlan } from '@/core/types';

defineProps<{ shift: ShiftScheduledByPlan }>()

</script>