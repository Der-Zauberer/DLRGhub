<template>

    <div class="container-xl" v-if="selectedPlan === undefined">

        <h4>Schichtpläne</h4>

        <button class="shift-plan" v-for="(shift, index) of plans.value" @click="selectedPlan = index">
            <span>{{ shift.name }}</span>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </button>

        <h4>Meine Schichten <swd-subtitle>Herbert Groß</swd-subtitle></h4>

        <button class="shift-link">
            <span>SO <swd-subtitle>20.07.2025</swd-subtitle></span>
            <div>
                <div>Wache 2025</div>
                <div>Wachleiter</div>
            </div>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </button>

        <button class="shift-link">
            <span>SA <swd-subtitle>26.07.2025</swd-subtitle></span>
            <div>
                <div>Wache 2025</div>
                <div>Wachleiter</div>
            </div>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </button>

    </div>

    <div class="container-xl" v-if="plans.value && selectedPlan !== undefined">

        <div class="flex flex-center">
            <button class="grey-color" @click="selectedPlan = undefined">
                <swd-icon class="left-icon"></swd-icon>
                Zurück
            </button>
            <p>{{ plans.value[selectedPlan].name }}</p>
        </div>

        <div class="grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1 shift-table">

            <div class="shift" v-for="(shift, index) in plans.value[selectedPlan].shifts" tabindex="0" @click="selectedShift = index" @keydown.enter="selectedShift = index">
                <div>
                <div class="shift__title">{{ shift.name }}</div>
                <div class="shift__date">{{ shift.date.toLocaleDateString() }}</div>
                </div>
                <div>
                <div class="shift__role">Wachleiter:</div>
                <div class="shift__name">Herbert Groß</div>
                </div>
                <div>
                <div class="shift__role">Wachgänger:</div>
                <div class="shift__name">Emely Schwarz</div>
                <div class="shift__name">Frederik Hubert</div>
                <div class="shift__name">Laura Wälder</div>
                </div>
            </div>

        </div>

        <swd-card>
            <h4>Rollen</h4>

            <div v-for="(role, index) of plans.value[selectedPlan].roles">
                <span>{{ role }}</span>
                <button class="ghost" @click="plans.value[selectedPlan].roles.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <input class="left-item" placeholder="Wachleiter, Sanitäter, Wachgänger" v-model="newRole">
            <button class="right-item" @click="newRole ? plans.value[selectedPlan].roles.push(newRole) : {}; newRole = undefined"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
        </swd-card>

    </div>

    <swd-dialog shown v-if="plans.value && selectedPlan !== undefined && selectedShift !== undefined">
        <swd-card>
            <h4>Dialog</h4>

            <div class="grid-cols-1">

                <h6>Allgemeine Einstellungen</h6>

                <swd-input>
                    <label for="shift-name">Schichtname</label>
                    <input id="shift-name" v-model="plans.value[selectedPlan].shifts[selectedShift].name">
                </swd-input>

                <swd-input>
                    <label for="shift-name">Datum</label>
                    <input id="shift-name" type="date" :value="plans.value[selectedPlan].shifts[selectedShift].date.toISOString()[0]">
                </swd-input>

                <div v-for="role of plans.value[selectedPlan].roles" style="display: contents;">
                    <h6>{{ role }}</h6>
                    <input v-for="person of plans.value[selectedPlan].shifts[selectedShift]">
                </div>

                <h6>Wachleiter</h6>

                <input>

                <h6>Sanitäter</h6>

                <input>

                <div class="grid-cols-sm-2 grid-cols-1">
                    <button class="grey-color" @click="selectedShift = undefined">Cancel</button>
                    <button @click="selectedShift = undefined">Save</button>
                </div>

            </div>
        </swd-card>
    </swd-dialog>

</template>

<style scoped>

.shift-plan, .shift-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    text-align: left;
    color: var(--theme-text-color);
    --theme-primary-color: var(--theme-element-primary-color);
    --theme-secondary-color: var(--theme-element-secondary-color);
    padding: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-element-spacing);
}

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
import type { DataService } from '@/services/data.service';
import { RecordId } from 'surrealdb';
import { inject, ref } from 'vue';

const dataService = inject('dataService') as DataService

const selectedPlan = ref<number | undefined>()
const selectedShift = ref<number | undefined>()
const newRole = ref<string | undefined>()

const plans = resource({
    loader: () => dataService.getShiftPlans()
})

</script>