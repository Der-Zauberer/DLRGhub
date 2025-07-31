<template>

    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :status="plan.status" :back="{ name: 'plans' }">
            <RouterLink :to="{ name: 'shift-edit', params: { id: $route.params.id } }" class="button grey-color"><swd-icon class="settings-icon"></swd-icon></RouterLink>
        </HeadlineComponent>

        <swd-card-outline v-if="plan.status === 'EMPTY'">TODO Empty State</swd-card-outline>

        <swd-loading-spinner v-if="plan.status === 'LOADING' && plan.empty" loading="true" class="width-100"></swd-loading-spinner>

        <swd-card class="red-color" v-if="plan.error">{{ plan.error }}</swd-card>

        <ul class="grid-cols-xl-4 grid-cols-lg-3 grid-cols-md-2 grid-cols-sm-1 grid-cols-1">
            <li v-for="shift of plan.value?.shifts"><ShiftComponent :shift="shift" :roles="plan.value?.roles || []"/></li>
        </ul>

        <DialogComponent :name="shiftEditData?.name || ''" v-model="shiftEditDialog">

            <div class="grid-cols-1" v-for="role of plan.value?.roles" v-if="shiftEditData">
                <h6>{{ role }}</h6>
                <ListInputComponent 
                    :list="shiftEditData.people.filter(person => person.role === role).map(person => person.name)"
                    @add="data.addShiftPerson(shiftEditData.id, { name: $event, role: role })"
                    @delete="data.removeShiftPerson(shiftEditData.id, { name: $event, role: role })"
                />
            </div>

            <div class="grid-cols-1" v-if="shiftEditData">
                <h6>Sonstige</h6>
                <ListInputComponent 
                    :list="shiftEditData.people.filter(person => !plan.value?.roles.includes(person.role)).map(person => person.name)"
                    @add="data.addShiftPerson(shiftEditData.id, { name: $event })"
                    @delete="data.removeShiftPerson(shiftEditData.id, { name: $event })"
                />
            </div>
        </DialogComponent>

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
import DialogComponent from '@/components/DialogComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import ListInputComponent from '@/components/ListInputComponent.vue';
import ShiftComponent from '@/components/ShiftComponent.vue';
import type { Shift } from '@/core/types';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { RecordId } from 'surrealdb';
import { inject, onBeforeUnmount, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const shiftEditData = ref<Shift | undefined>()
const shiftEditDialog = ref<boolean>()

const plan = data.getPlan(new RecordId('plan', route.params.id), new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

function openShiftEditDialog(shift: Shift) {
    shiftEditData.value = shift
    shiftEditDialog.value = true
}

</script>