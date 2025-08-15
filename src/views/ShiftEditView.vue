<template>
    
    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :status="plan.status" :back="{ name: 'plans' }">
            <button><swd-icon class="delete-icon"></swd-icon> Delete</button>
            <button><swd-icon class="done-icon"></swd-icon> Save</button>
        </HeadlineComponent>

        <swd-loading-spinner :loading="plan.loading && !plan.value" class="width-100"></swd-loading-spinner>

        <form v-if="plan.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name" v-model="plan.value.name"/>
            </div>

            <h6>Rollen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div class="flex" v-for="(role, index) in plan.value.roles" :key="index">
                    <InputComponent class="width-100" v-model="plan.value.roles[index]"/>
                    <button class="grey-color" @click="plan.value.roles.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
                </div>
                <button class="grey-color" @click="plan.value.roles.push('')"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
            </div>

            <h6>Schichten</h6>
            <div v-for="(shift, index) in plan.value.shifts" class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name (Optional)" v-model="shift.name"/>
                <InputComponent label="Datum" v-model="shift.date" type="date"/>
                <InputComponent label="Uhrzeit von (Optional)" v-model="shift.begin" type="time"/>
                <InputComponent label="Uhrzeit bis (Optional)" v-model="shift.end" type="time"/>
                <button class="grey-color" @click="plan.value.shifts.splice(index, 1)"><swd-icon class="delete-icon"></swd-icon></button>
            </div>
            <button class="grey-color" @click="plan.value.shifts.push({ id: new RecordId('shift', ''), date: new Date(), people: [] })"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>

        </form>

    </div>

</template>

<script setup lang="ts">
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { PlanScedulesShift } from '@/core/types'
import { DATA_SERVICE, DataService } from '@/services/data.service'
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql } from 'surrealdb'
import { inject, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const plan = resource({
    initializer: async () => (await surrealdb.query<[PlanScedulesShift]>(surql`SELECT *, (SELECT * FROM id->scedules->shift ORDER BY date) as shifts FROM ONLY ${new RecordId('plan', route.params.id)};`))[0],
    loader: async () => (await surrealdb.query<[PlanScedulesShift]>(surql`SELECT *, (SELECT * FROM id->scedules->shift ORDER BY date) as shifts FROM ONLY ${new RecordId('plan', route.params.id)};`))[0],
})

async function save() {
    const form = formRef.value
    if (!form) return
    if (!form.checkValidity()) {
        form.reportValidity()
        return
    }
    await plan.reload()
    //TODO route back
}

</script>