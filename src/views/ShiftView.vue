<template>

    <div class="container-xl">
        <div class="flex flex-center">
            <RouterLink :to="{ name: 'plans' }" class="button grey-color">
                <swd-icon class="left-icon" ></swd-icon>
            </RouterLink>
            <p>{{ plan.value?.plan.name }}</p>
        </div>

        <ul class="shifts grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1">
            <li v-for="shift of plan.value?.shifts" tabindex="0" @click="openShiftEditDialog(shift)" @keydown.enter="openShiftEditDialog(shift)">
                <h5 class="margin-top-0">
                    {{ shift.name }}
                    <swd-subtitle>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</swd-subtitle>
                    <swd-subtitle v-if="shift.startTime && shift.endTime">{{ shift.startTime }} - {{ shift.endTime }}</swd-subtitle>
                </h5>

                <div v-for="role of plan.value?.plan.roles" class="margin-bottom">
                    <div><strong>{{ role }}</strong></div>
                    <div v-for="person of shift.people.filter(person => person.role === role)">
                        <i>{{ person.firstname }} {{ person.lastname }}</i>
                    </div>
                </div>
                <div v-for="person of shift.people.filter(person => !plan.value?.plan.roles.includes(person.role))">
                    <i>{{ person.firstname }} {{ person.lastname }}</i>
                </div>
            </li>
        </ul>

        <DialogComponent :name="shiftEditData?.name || ''" v-model="shiftEditDialog">

            <div class="grid-cols-1" v-for="role of plan.value?.plan.roles" v-if="shiftEditData">
                <h6>{{ role }}</h6>
                <div>
                    <div v-for="person of shiftEditData.people.filter(person => person.role === role)">
                        <span>{{ person.firstname }} {{ person.lastname }}</span>
                        <button class="ghost"><swd-icon class="delete-icon"></swd-icon></button>
                    </div>
                </div>
                <div class="flex">
                    <input :ref="`person-${role}`">
                    <button class="grey-color" @click="console.log((($refs[`person-${role}`] as [HTMLInputElement])[0] as HTMLInputElement).value)"><swd-icon class="add-icon"></swd-icon></button>
                </div>
            </div>

            <div class="grid-cols-1" v-if="shiftEditData">
                <h6>Sonstige</h6>
                <div>
                    <div v-for="person of shiftEditData.people.filter(person => !plan.value?.plan.roles.includes(person.role))">
                        <span>{{ person.firstname }} {{ person.lastname }}</span>
                        <button class="ghost"><swd-icon class="delete-icon"></swd-icon></button>
                    </div>
                </div>
                <div class="flex">
                    <input ref="person">
                    <button class="grey-color" @click="console.log(($refs.person as HTMLInputElement).value)"><swd-icon class="add-icon"></swd-icon></button>
                </div>
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
import { resource } from '@/core/resource';
import type { Shift } from '@/core/types';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { RecordId } from 'surrealdb';
import { computed, inject, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const shiftEditData = ref<Shift | undefined>()
const shiftEditDialog = ref<boolean>()

const plan = resource({
    loader: () => data.getPlan(new RecordId('plan', route.params.id))
})

function openShiftEditDialog(shift: Shift) {
    shiftEditData.value = shift
    shiftEditDialog.value = true
}

</script>