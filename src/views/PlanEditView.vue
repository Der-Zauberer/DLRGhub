<template>
    
    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plan', params: { id: $route.params.id } }">
            <ButtonComponent v-if="plan.value" icon="delete" @click="openDeleteDialog(plan.value)"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <swd-loading-spinner :loading="savePlan.loading">
                <ButtonComponent v-if="plan.value" icon="done" @click="savePlan.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(plan.error).key === 'error.connection'" :loading="plan.loading" @reload="plan.reload()"/>
        <dlrg-error v-if="(plan?.status === 'ERROR' && parseCustomSurrealDbError(plan.error).key !== 'error.connection') || savePlan?.status === 'ERROR'">{{ plan?.error || savePlan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="plan.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name" v-model="plan.value.name"/>
            </div>

            <h6>Rollen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div class="flex no-gap action-input" v-for="(role, index) in plan.value.roles" :key="index">
                    <InputComponent class="width-100 left-item" v-model="plan.value.roles[index]"/>
                    <button type="button" class="grey-color right-item" @click.prevent="plan.value.roles.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
                </div>
                <button type="button" class="grey-color" @click.prevent="plan.value.roles.push('')"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
            </div>

            <h6>Schichten</h6>
            <div class="input-table">
                <div class="input-table__header">
                    <div>Datum</div>
                    <div>Name (Optional)</div>
                    <div>Uhrzeit von (Optional)</div>
                    <div>Uhrzeit bis (Optional)</div>
                    <div></div>
                </div>
                <div v-for="(shift, index) in plan.value.shifts" :key="index" class="input-table__row">
                    <swd-input class="ghost">
                        <label :label="`date-${index}`">Datum</label>
                        <input :id="`date-${index}`" :value="dateToIsoDate(shift.date)" @input="shift.date = isoDateToDate(($event.target as HTMLInputElement).value) as unknown as Date;" type="date">    
                    </swd-input>
                    <swd-input class="ghost">
                        <label :label="`name-${index}`">Name (Optional)</label>
                        <input :id="`name-${index}`" v-model="shift.name">    
                    </swd-input>
                    <swd-input class="ghost">
                        <label :label="`time-from-${index}`">Uhrzeit von (Optional)</label>
                        <input :id="`time-from-${index}`" v-model="shift.begin" type="time">    
                    </swd-input>
                    <swd-input class="ghost">
                        <label :label="`time-to-${index}`">Uhrzeit bis (Optional)</label>
                        <input :id="`time-to-${index}`" v-model="shift.end" type="time">    
                    </swd-input>
                    <ButtonComponent color="ELEMENT" icon="delete" aria-label="Löschen" @click.prevent="deleteShiftRow(plan.value, index)"/>
                </div>
            </div>
            <div class="flex flex-space-between"><div></div><ButtonComponent color="ELEMENT" icon="add" @click.prevent="addShiftRow(plan.value)">Hinzufügen</ButtonComponent></div>
        
        </form>

    </div>

</template>

<style scoped>

.action-input {
    & .grey-color {
        --theme-element-primary-color: var(--theme-secondary-grey-color); 
        --theme-element-secondary-color: var(--theme-tertiary-grey-color);
    }
}

.secondary-grey-color {
    --theme-element-primary-color: var(--theme-secondary-grey-color); 
    --theme-element-secondary-color: var(--theme-tertiary-grey-color);
}

.input-table {
    display: grid;
    grid-template-columns: auto auto auto auto fit-content(0);
    gap: var(--theme-border-width);
    background: var(--theme-element-primary-color);
    padding: var(--theme-border-width);
    border-radius: var(--theme-border-radius);
    margin-bottom: var(--theme-element-spacing);

    & .input-table__header {
        display: contents;
        background: var(--theme-element-primary-color);

        & > div {
            padding: calc(round(.5em,1px) - var(--theme-border-width));
        }
    }

    & .input-table__row {
        display: contents;

        & swd-input {
            background: var(--theme-background-color);
            padding: round(.5em,1px) round(.6em,1px);
            border: none;
            outline: var(--theme-border-width) solid transparent !important;

            & label {
                display: none;
            }

            &:hover {
                outline-color: var(--theme-element-secondary-color) !important;
            }

            &:focus, &:active, &:has(input:focus) {
                outline-color: var(--theme-primary-color) !important;
            }
        }
    }
}

@media only screen and (max-width: 767px) {
    .input-table {
        display: block;
        background: transparent;
        margin-bottom: none;

        & .input-table__header {
            display: none;
        }

        & .input-table__row {
            display: grid;
            grid-template-columns: auto;
            gap: var(--theme-border-width);
            background: var(--theme-element-primary-color);
            padding: var(--theme-border-width);
            border-radius: var(--theme-border-radius);
            margin-bottom: var(--theme-element-spacing);

            & swd-input label {
                display: initial;
            }
        }
    }
}

</style>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { resource } from '@/core/resource'
import type { Plan, PlanSchedulesShift, Shift } from '@/core/types'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { DATA_SERVICE, DataService, dateToIsoDate, isoDateToDate } from '@/services/data.service'
import { RecordId, surql } from 'surrealdb'
import { inject, ref, toRaw, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'

const route = useRoute()
const router = useRouter()
const dialogService = inject(DIALOG_SERVICE) as DialogService
const dataService = inject(DATA_SERVICE) as DataService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const plan = resource({
    loader: async () => (await surrealdb.query<[PlanSchedulesShift]>(surql`SELECT *, (SELECT * FROM id->schedules->shift ORDER BY date) as shifts FROM ONLY ${new RecordId('plan', route.params.id)};`))[0],
})

const shiftsToAdd: Shift[] = []
const shiftsToRemove: Shift[] = []

function addShiftRow(plan: PlanSchedulesShift) {
    const shift: Shift = { id: undefined as unknown as RecordId<'shift'>, date: new Date(), people: [] }
    plan.shifts.push(shift)
    shiftsToAdd.push(shift)
}

function deleteShiftRow(plan: PlanSchedulesShift, index: number) {
    const shift = toRaw(plan.shifts[index])
    plan.shifts.splice(index, 1)
    const position = shiftsToAdd.indexOf(shift)
    if (position !== -1) {
        shiftsToAdd.splice(position, 1)
    } else {
        shiftsToRemove.push(shift)
    }
}

const savePlan = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !plan.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }
        await surrealdb.query(surql`
            BEGIN TRANSACTION;
            UPDATE ${plan.value.id} CONTENT ${plan.value};
            FOR $shift IN ${shiftsToAdd} {
                LET $plan = ${plan.value.id};
                LET $id = (INSERT INTO shift $shift).id;
                RELATE $plan->schedules->$id;
            };
            FOR $shift IN ${shiftsToRemove} {
                LET $id = $shift.id;
                DELETE $id;
            };
            FOR $shift IN ${plan.value.shifts.filter(shift => shift.id)} {
                UPDATE $shift.id CONTENT $shift;
            };
            COMMIT TRANSACTION;
        `);

        router.push({ name: 'plan', params: { id: route.params.id } })
    }
})

function openDeleteDialog(plan: Plan) {
    dialogService.open = {
        title: 'Dienstplan löschen',
        content: ['Bist du sicher den Dienstplan zu löschen?', `<code>${plan.name}</code>`],
        action: 'Löschen',
        filter: () => dataService.deletePlan(plan.id).then(() => true),
        success: () => router.push({ name: 'plans' })
    }
}

</script>