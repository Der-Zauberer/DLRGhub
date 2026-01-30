<template>

    <div class="container-xl">

        <OfflineComponent v-if="parseCustomSurrealDbError(plans.error || shifts.error).key === 'error.connection'" :loading="plans.loading || shifts.loading" @reload="(plans.reload(), shifts.reload())"/>

        <HeadlineComponent title="Dienstpläne" :resource="plans" type="Dienstpläne">
            <ButtonComponent icon="add" color="ELEMENT" :aria-label="plans.status!=='EMPTY' ? 'Neuen Dienstplan erstellen' : undefined" @click="planCreateDialog = true">{{ plans.status==='EMPTY' ? 'Neuen Dienstplan erstellen' : undefined }}</ButtonComponent>
            <DialogComponent title="Neuer Wachplan" action="Speichern" v-model="planCreateDialog" :filter="createPlan">
                <form class="grid-cols-1">
                    <InputComponent label="Name" v-model="createPlanForm.name" required/>
                </form>
            </DialogComponent>
        </HeadlineComponent>

        <dlrg-empty v-if="plans?.status === 'EMPTY'">Keine Dienstpläne gefunden!</dlrg-empty>
        <dlrg-error v-if="plans?.status === 'ERROR' && parseCustomSurrealDbError(plans.error).key !== 'error.connection'">{{ plans?.error }}</dlrg-error>
        <swd-loading-spinner v-if="plans?.status === 'LOADING' && !plans?.value" class="width-100" loading="true"></swd-loading-spinner>

        <ul class="button-grid grid-cols-md-2 grid-cols-1">
            <li v-for="plan of plans.value" :key="plan.id.id.toString()">
                <ButtonLinkComponent :to="{ name: 'plan', params: { id: plan.id.id.toString() } }">{{ plan.name }}</ButtonLinkComponent>
            </li>
        </ul>

        <HeadlineComponent title="Meine Schichten" :subtitle="profileName || 'Nicht konfiguriert'" :resource="shifts">
            <ButtonComponent icon="settings" color="ELEMENT" :aria-label="profileName ? 'Konfigurieren' : undefined" :to="{ name: 'profile' }">{{ !profileName ? 'Konfigurieren' : undefined }}</ButtonComponent>
        </HeadlineComponent>

        <dlrg-empty v-if="shifts?.status === 'EMPTY'">Keine Schichten gefunden!</dlrg-empty>
        <dlrg-error v-if="shifts?.status === 'ERROR' && parseCustomSurrealDbError(plans.error).key !== 'error.connection'">{{ shifts?.error }}</dlrg-error>
        <swd-loading-spinner v-if="shifts?.status === 'LOADING' && !shifts?.value" class="width-100" loading="true"></swd-loading-spinner>

        <ul class="grid-cols-md-2 grid-cols-1">
            <li v-for="shift of shifts.value" :key="shift.id.id.toString()">
                <AppointmentComponent :shift="shift"/>
            </li>
        </ul>

    </div>

</template>

<script setup lang="ts">
import AppointmentComponent from '@/components/AppointmentComponent.vue'
import ButtonComponent from '@/components/ButtonComponent.vue'
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { DATA_SERVICE, DataService } from '@/services/data.service'
import { parseCustomSurrealDbError } from '@/services/surrealdb.service'
import { inject, onBeforeUnmount, reactive, ref } from 'vue'

const data = inject(DATA_SERVICE) as DataService

const profileName = data.profileName
const planCreateDialog = ref<boolean>(false)

const createPlanForm = reactive<{ name?: string }>({})

const plans = data.getPlans(new Promise<void>(resolve => onBeforeUnmount(() => resolve())))
const shifts = data.getPersonShift(profileName.value, new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

async function createPlan(): Promise<boolean> {
    if (!createPlanForm.name) return false
    await data.createPlan(createPlanForm.name)
    return true
}

</script>