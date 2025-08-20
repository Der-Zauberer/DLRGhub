<template>
    
    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :resource="plan" :back="{ name: 'plans' }">
            <button v-if="plan.value" @click="planDeleteDialog = true"><swd-icon class="delete-icon"></swd-icon> Delete</button>
            <DialogComponent v-if="plan.value" name="Dienstplan löschen" action="Löschen" v-model="planDeleteDialog" @success="deletePlan(plan.value.id)">
                <p>Bist du sicher den Dienstplan zu löschen?</p>
                <code>{{ plan.value?.name }}</code>
            </DialogComponent>
            <button v-if="plan.value" @click="savePlan()"><swd-icon class="done-icon"></swd-icon> Save</button>
        </HeadlineComponent>

        <form v-if="plan.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name" v-model="plan.value.name"/>
            </div>

            <h6>Rollen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div class="flex" v-for="(role, index) in plan.value.roles" :key="index">
                    <InputComponent class="width-100" v-model="plan.value.roles[index]"/>
                    <button type="button" class="grey-color" @click.prevent="plan.value.roles.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
                </div>
                <button type="button" class="grey-color" @click.prevent="plan.value.roles.push('')"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
            </div>

            <h6>Schichten</h6>
            <div v-for="(shift, index) in plan.value.shifts" class="grid-cols-sm-2 grid-cols-1" :key="index">
                <InputComponent label="Name (Optional)" v-model="shift.name"/>
                <InputComponent label="Datum" :value="dateToISODate(shift.date)" @input="shift.date = isoDateToDate(($event.target as HTMLInputElement).value) as unknown as Date" type="date"/>
                <InputComponent label="Uhrzeit von (Optional)" v-model="shift.begin" type="time"/>
                <InputComponent label="Uhrzeit bis (Optional)" v-model="shift.end" type="time"/>
                <button type="button" class="grey-color" @click.prevent="shiftsToRemove.push(plan.value.shifts[index]); plan.value.shifts.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <button type="button" class="grey-color" @click.prevent="shiftsToAdd.push(plan.value.shifts[plan.value.shifts.push({ id: undefined as unknown as RecordId<'shift'>, date: new Date(), people: [] }) - 1 ])"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>

        </form>

    </div>

</template>

<script setup lang="ts">
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

async function savePlan() {
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

async function deletePlan(id: RecordId) {
    await surrealdb.delete(id)
    router.push({ name: 'plans' })
}

</script>