<template>
    
    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <ButtonComponent v-if="plan.value" icon="delete" @click="planDeleteDialog = true">Löschen</ButtonComponent>
            <DialogComponent v-if="plan.value" name="Dienstplan löschen" action="Löschen" v-model="planDeleteDialog" @success="deletePlan(plan.value.id)">
                <p>Bist du sicher den Dienstplan zu löschen?</p>
                <code>{{ plan.value?.name }}</code>
            </DialogComponent>
            <swd-loading-spinner :loading="savePlan.loading">
                <ButtonComponent v-if="plan.value" icon="done" @click="savePlan.reload()">Speichern</ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <dlrg-error v-if="plan?.status === 'ERROR' || savePlan?.status === 'ERROR'">{{ plan?.error || savePlan?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plan?.status === 'LOADING' && !plan?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="plan.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name" v-model="plan.value.name"/>
            </div>

            <h6>Rollen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div class="flex flex-roles" v-for="(role, index) in plan.value.roles" :key="index">
                    <InputComponent class="width-100" v-model="plan.value.roles[index]"/>
                    <button type="button" class="grey-color" @click.prevent="plan.value.roles.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
                </div>
                <button type="button" class="grey-color" @click.prevent="plan.value.roles.push('')"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
            </div>

            <h6>Schichten</h6>
            <div v-for="(shift, index) in plan.value.shifts" class="grid-cols-shifts" :key="index">
                <div class="grid-cols-md-2 grid-cols-1">
                    <InputComponent label="Datum" :value="dateToISODate(shift.date)" @input="shift.date = isoDateToDate(($event.target as HTMLInputElement).value) as unknown as Date" type="date"/>
                    <InputComponent label="Name (Optional)" v-model="shift.name"/>
                </div>
                <div class="grid-cols-md-2 grid-cols-1">
                    <InputComponent label="Uhrzeit von (Optional)" v-model="shift.begin" type="time"/>
                    <InputComponent label="Uhrzeit bis (Optional)" v-model="shift.end" type="time"/>
                </div>
                <ButtonComponent color="ELEMENT" icon="delete" aria-label="Löschen" @click.prevent="shiftsToRemove.push(plan.value.shifts[index]); plan.value.shifts.splice(index, 1)"/>
            </div>
            <ButtonComponent color="ELEMENT" icon="add" @click.prevent="shiftsToAdd.push(plan.value.shifts[plan.value.shifts.push({ id: undefined as unknown as RecordId<'shift'>, date: new Date(), people: [] }) - 1 ])">Hinzufügen</ButtonComponent>
        </form>

    </div>

</template>

<style scoped>

.flex-roles {
    gap: var(--theme-inner-element-spacing);
}

.grid-cols-shifts {
    grid-template-columns: auto auto fit-content(0);
    align-items: end;
}

@media only screen and (max-width: 767px) {
  .grid-cols-shifts {
    margin-bottom: calc(var(--theme-element-spacing) * 2);
  }
}

</style>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import DialogComponent from '@/components/DialogComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { PlanSchedulesShift, Shift } from '@/core/types'
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { dateToISODate, isoDateToDate } from '@/services/data.service'
import { RecordId, surql } from 'surrealdb'
import { inject, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const planDeleteDialog = ref<boolean>(false)

const plan = resource({
    loader: async () => (await surrealdb.query<[PlanSchedulesShift]>(surql`SELECT *, (SELECT * FROM id->schedules->shift ORDER BY date) as shifts FROM ONLY ${new RecordId('plan', route.params.id)};`))[0],
})

const shiftsToAdd: Shift[] = []
const shiftsToRemove: Shift[] = []

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
            FOR $shift IN ${plan.value.shifts.filter(shift => !shiftsToAdd.includes(shift))} {
                UPDATE $shift.id CONTENT $shift;
            };
            COMMIT TRANSACTION;
        `);

        router.push({ name: 'shifts', params: { id: route.params.id } })
    }
})

async function deletePlan(id: RecordId) {
    await surrealdb.delete(id)
    router.push({ name: 'plans' })
}

</script>