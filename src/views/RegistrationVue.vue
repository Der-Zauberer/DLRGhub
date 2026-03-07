<template>

    <div v-if="!route.params.id" class="container-xl">

        <HeadlineComponent :back="{ name: 'home' }" title="Registrierungen"></HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(registrations.error).key === 'error.connection'" :loading="registrations.loading" @reload="registrations.reload()"/>
        <dlrg-empty v-if="registrations?.status === 'EMPTY'">Keine Registrierungen gefunden!</dlrg-empty>
        <dlrg-error v-if="(registrations?.status === 'ERROR' && parseCustomSurrealDbError(registrations.error).key !== 'error.connection')">{{ registrations?.error }}</dlrg-error>
        <swd-loading-spinner v-if="registrations?.status === 'LOADING' && !registrations?.value" class="width-100" loading="true"></swd-loading-spinner>

        <div class="grid-cols-1">
            <swd-card v-for="registration in registrations.value" class="flex flex-space-between">
                <div>
                    {{ registration.firstname }} {{ registration.lastname }}
                    <swd-subtitle>{{ registration.email }}</swd-subtitle>
                </div>
                <div style="display: flex; gap: var(--theme-inner-element-spacing)">
                    <ButtonComponent class="grey-color" icon="pen" :to="{ name: 'registration-edit', params: { id: registration.id.id.toString() }}"></ButtonComponent>
                    <ButtonComponent class="grey-color" icon="close" @click="decline(registration)"></ButtonComponent>
                    <ButtonComponent icon="done" @click="accept(registration)"></ButtonComponent>
                </div>
            </swd-card>
        </div>

    </div>

    <div v-if="route.params.id" class="container-xl">

        <HeadlineComponent :title="registration.value?.firstname + ' ' + registration.value?.lastname" :resource="registration" :back="{ name: 'registrations' }">
            <ButtonComponent v-if="registration.value && route.params.id !== 'new'" icon="delete" @click="decline(registration.value as Registration)"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <swd-loading-spinner :loading="saveRegistration.loading">
                <ButtonComponent v-if="registration.value" icon="done" @click="saveRegistration.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(registration.error).key === 'error.connection'" :loading="registration.loading" @reload="registration.reload()"/>
        <dlrg-error v-if="(registration?.status === 'ERROR' && parseCustomSurrealDbError(registration.error).key !== 'error.connection') || saveRegistration?.status === 'ERROR'">{{ registration?.error || saveRegistration?.error }}</dlrg-error>
        <swd-loading-spinner v-if="registration?.status === 'LOADING' && !registration?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="registration.value" ref="form">
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent class="grid-span-sm-2 grid-span-1" label="Email" type="email" v-model="registration.value.email" required/>
                <InputComponent label="Vorname" v-model="registration.value.firstname" required/>
                <InputComponent label="Nachname" v-model="registration.value.lastname"/>
            </div>
        </form>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { resource } from '@/core/resource'
import type { Registration } from '@/core/types'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql, Table } from 'surrealdb'
import { inject, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const dialogService = inject(DIALOG_SERVICE) as DialogService
const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const registrations = resource({
    parameter: { route },
    loader: parameter => !parameter.route.params.id ? surreal.up().then(() => surreal.select<Registration>(new Table('registration'))): undefined
})

const registration = resource({
    parameter: { route },
    loader: parameter => parameter.route.params.id ? surreal.up().then(() => surreal.select<Registration>(new RecordId('registration', parameter.route.params.id))) : undefined
})

async function accept(registration: Registration) {
    dialogService.open = {
        title: 'Registrierung annehmen',
        content: [`Soll die Registrierung ${registration.firstname} ${registration.lastname} als Benutzer aufgenommen werden?`],
        action: 'Annehmen',
        filter: async () => await surreal.up().then(() => surreal.query(surql`UPDATE ${registration.id} SET approve = true`)).then(() => true),
        success: () => (dialogService.open = {
            title: 'Registrierung angenommen',
            content: [`Der Registrierung ${registration.firstname} ${registration.lastname} wurde angenommen.`]
        }, registrations.reload())
    }
}

async function decline(registration: Registration) {
    dialogService.open = {
        title: 'Registrierung ablehnen',
        content: [`Soll die Registrierung ${registration.firstname} ${registration.lastname} abgelehnt werden?`],
        action: 'Ablehnen',
        filter: async () => await surreal.up().then(() => surreal.delete(registration.id)).then(() => true),
        success: () => (dialogService.open = {
            title: 'Registrierung abgelehnt',
            content: [`Der Registrierung ${registration.firstname} ${registration.lastname} wurde abgelehnt.`]
        }, registrations.reload())
    }
}

const saveRegistration = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !registration.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }
        await surreal.up()
        await surreal.query(surql`UPDATE ONLY ${registration.value.id} MERGE ${registration.value}`)
        router.push({ name: 'registrations' })
    }
})

</script>