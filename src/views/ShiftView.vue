<template>

    <div class="container-xl">
        <div class="flex flex-center">
            <RouterLink :to="{ name: 'plans' }" class="button grey-color">
                <swd-icon class="left-icon" ></swd-icon>
            </RouterLink>
            <p>{{ plan.value?.name }} <swd-icon v-if="plan.loading" class="loading-spinner-icon"></swd-icon></p>
        </div>

        <div>{{ plan.status }}</div>
        <div>{{ !!plan.value }}</div>
        <div>{{ plan.error }}</div>

        <button @click="plan.reload()">Reload</button>

        <ul class="shifts grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1">
            <li v-for="shift of plan.value?.shifts" tabindex="0" @click="openShiftEditDialog(shift)" @keydown.enter="openShiftEditDialog(shift)">
                <h5 class="margin-top-0">
                    {{ shift.name }}
                    <swd-subtitle>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</swd-subtitle>
                    <swd-subtitle v-if="shift.startTime && shift.endTime">{{ shift.startTime }} - {{ shift.endTime }}</swd-subtitle>
                </h5>

                <div v-for="role of plan.value?.roles" class="margin-bottom">
                    <div><strong>{{ role }}</strong></div>
                    <div v-for="person of shift.people.filter(person => person.role === role)">
                        <i>{{ person.name }}</i>
                    </div>
                </div>
                <div v-for="person of shift.people.filter(person => !plan.value?.roles.includes(person.role))">
                    <i>{{ person.name }}</i>
                </div>
            </li>
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
import ListInputComponent from '@/components/ListInputComponent.vue';
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