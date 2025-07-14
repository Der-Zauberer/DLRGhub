<template>

    <div class="container-xl" v-if="selectedPlan === undefined">

        <swd-card class="swd-card-hover flex flex-space-between" tabindex="0" v-for="(shift, index) of plans.value" @click="selectedPlan = index" @keydown.enter="selectedPlan = index" >
            <span>{{ shift.name }}</span>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </swd-card>

    </div>

    <div class="container-xl" v-if="plans.value && selectedPlan !== undefined">

        <button @click="selectedPlan = undefined">Close</button>

        <div class="grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1 shift-table">

            <div class="shift" v-for="(shift, index) in plans.value[selectedPlan].shifts" tabindex="0" @click="selectedShift = index" @keydown.enter="selectedShift = index">
                <div>
                <div class="shift__title">{{ shift.name }}</div>
                <div class="shift__date">{{ shift.date.toLocaleDateString() }}</div>
                </div>
                <div>
                <div class="shift__role">Wachleiter:</div>
                <div class="shift__name">Felix Hohenberger</div>
                </div>
                <div>
                <div class="shift__role">Wachgänger:</div>
                <div class="shift__name">André Sommer</div>
                <div class="shift__name">Cari Ruh</div>
                </div>
            </div>

        </div>

    </div>

    <swd-dialog shown v-if="plans.value && selectedPlan !== undefined && selectedShift !== undefined">
        <swd-card>
            <h4>Dialog</h4>

            <swd-input>
                <label for="shift-name">Schichtname</label>
                <input id="shift-name" v-model="plans.value[selectedPlan].shifts[selectedShift].name">
            </swd-input>

            <swd-input>
                <label for="shift-name">Datum</label>
                <input id="shift-name" type="date" v-model="plans.value[selectedPlan].shifts[selectedShift].date">
            </swd-input>

            <div class="grid-cols-sm-2 grid-cols-1">
            <button class="grey-color" @click="selectedShift = undefined">Cancel</button>
            <button @click="selectedShift = undefined">Save</button>
        </div>
        </swd-card>
    </swd-dialog>

</template>

<style scoped>

.shift-table {
  background: var(--theme-element-primary-color);
  gap: var(--theme-border-width);
  padding: var(--theme-border-width);
}

.shift {
  box-sizing: border-box;
  min-width: 150px;
  flex-grow: 1;
  background: var(--theme-background-color);
  padding: var(--theme-inner-element-spacing);
  cursor: pointer;
}

.shift >:not(:last-child) {
  margin-bottom: var(--theme-inner-element-spacing);
}

.shift .shift__title {
  font-weight: bold;
  font-size: 2em;
}

.shift .shift__role {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8em;
}

.shift .shift__name {
  font-style: italic;
  font-size: 0.8em;
}

</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import type { ShiftPlan } from '@/core/types';
import { RecordId } from 'surrealdb';
import { ref } from 'vue';

const selectedPlan = ref<number | undefined>()
const selectedShift = ref<number | undefined>()

const plans = resource({
    loader: () => [{
        id: new RecordId('shift_plan', 'abcd'),
        name: 'Wachplan 2025',
        shifts: [
            { name: 'SA', date: new Date('2025-07-12') },
            { name: 'SO', date: new Date('2025-07-13') },
            { name: 'SA', date: new Date('2025-07-19') },
            { name: 'SO', date: new Date('2025-07-20') },
            { name: 'SA', date: new Date('2025-07-26') }
        ],
        roles: [
            'Wachleiter',
            'Sanitäter'
        ],
        people: [
            { firstName: 'André', lastName: 'Sommer' },
            { firstName: 'Cari', lastName: 'Ruh' },
            { firstName: 'Felix', lastName: 'Hohenberger' }
        ]
    } as ShiftPlan]
})

</script>