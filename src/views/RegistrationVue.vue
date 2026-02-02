<template>

    <div class="container-xl">

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
                    <ButtonComponent class="grey-color" @click="decline(registration)">Ablehnen</ButtonComponent>
                    <ButtonComponent @click="accept(registration)">Annehmen</ButtonComponent>
                </div>
            </swd-card>
        </div>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { resource } from '@/core/resource'
import type { Registration } from '@/core/types'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { surql } from 'surrealdb'
import { inject } from 'vue'

const dialogService = inject(DIALOG_SERVICE) as DialogService
const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService

const registrations = resource({
    loader: surreal.select<Registration>('registration')
})

async function accept(registration: Registration) {
    dialogService.open = {
        title: 'Registrierung annehmen',
        content: [`Soll die Registrierung ${registration.firstname} ${registration.lastname} als Benutzer aufgenommen werden?`],
        action: 'Annehmen',
        filter: async () => await surreal.query(surql`UPDATE ${registration.id} SET approve = true`).then(() => true),
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
        filter: async () => await surreal.delete(registration.id).then(() => true),
        success: () => (dialogService.open = {
            title: 'Registrierung abgelehnt',
            content: [`Der Registrierung ${registration.firstname} ${registration.lastname} wurde abgelehnt.`]
        }, registrations.reload())
    }
}

</script>