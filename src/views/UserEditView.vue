<template>

    <div class="container-xl">

        <HeadlineComponent :title="user.value?.displayname || 'Unbenannt'" :resource="user" :back="{ name: 'user' }">
            <ButtonComponent v-if="user.value && route.params.id !== 'new'" icon="delete" @click="openDeleteDialog(user.value as User)"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <swd-loading-spinner :loading="saveUser.loading">
                <ButtonComponent v-if="user.value" icon="done" @click="saveUser.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(user.error).key === 'error.connection'" :loading="user.loading" @reload="user.reload()"/>
        <dlrg-error v-if="(user?.status === 'ERROR' && parseCustomSurrealDbError(user.error).key !== 'error.connection') || saveUser?.status === 'ERROR'">{{ user?.error || saveUser?.error }}</dlrg-error>
        <swd-loading-spinner v-if="user?.status === 'LOADING' && !user?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="user.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Id" :disabled="$route.params.id !== 'new'" v-model="user.value.id!.id"/>
                <InputComponent label="Email" type="email" v-model="user.value.email" required/>
                <InputComponent label="Name" v-model="user.value.name" required/>
                <InputComponent label="Anzeigename" v-model="user.value.displayname" required/>
                <InputComponent label="Aktiviert" type="checkbox" v-model="user.value.account!.enabled"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.account!.expiry)" @input="user.value.account!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
            </div>
            
            <h6>Rolle</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Admin" type="checkbox" v-model="user.value.admin"/>
            </div>

            <h6>Zugangsdaten</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Änderung erzwingen" type="checkbox" v-model="user.value.credentials!.change"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.credentials!.expiry)" @input="user.value.credentials!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
                <InputComponent label="Passwort setzen" type="password" v-model="user.value.password"/>
                <button v-if="user.value" @click.prevent="logoutFromAllDevices(user.value.id!, user.value.name!)">Ausloggen von allen Geräten</button>
            </div>

            <h6>Sicherheitsinformationen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div v-if="user.value.login">
                    {{ user.value.login.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    <swd-subtitle>Letzter Login</swd-subtitle>
                </div>
                <div v-if="user.value.account?.valid">
                    {{ user.value.account?.valid.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    <swd-subtitle>Sessions gültig seit</swd-subtitle>
                </div>
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
import type { User } from '@/core/types'
import { isoDateToDate, dateToIsoDate } from '@/services/data.service'
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

const newUser: Partial<User> = {
    id: new RecordId('user', ''),
    admin: false,
    account: {
        enabled: false
    },
    credentials: {
        change: false
    }
}

const user = resource({
    loader: () => route.params.id === 'new' ? { ...newUser } : surreal.select<Partial<User>>(new RecordId('user', route.params.id))
})

const saveUser = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !user.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }

        if (route.params.id === 'new') {
            if (!user.value.id?.id) delete user.value.id
            await surreal.insert(new Table('user'), user.value)
        } else {
            await surreal.query(surql`UPDATE ONLY ${user.value.id} MERGE ${user.value}`)
        }
        
        router.push({ name: 'user' })
    }
})

function openDeleteDialog(user: User) {
    dialogService.open = {
        title: 'Benutzer löschen',
        content: ['Bist du sicher den Benutzer zu löschen?', `<swd-card>${user.displayname}<swd-subtitle>${user.name}</swd-subtitle><swd-subtitle>${user.email}</swd-subtitle></swd-card>`],
        action: 'Löschen',
        filter: () => surreal.delete(user.id).then(() => true),
        success: () => router.push({ name: 'user' })
    }
}

async function logoutFromAllDevices(id: RecordId<'user'>, name: string) {
    dialogService.open = {
        title: 'Benutzer ausloggen',
        content: [`Soll der Benutzer ${name} von allen Geräten ausgeloggt werden?`],
        action: 'Ausloggen',
        filter: async () => await surreal.query(surql`UPDATE ${id} SET account.valid = ${new Date()}`).then(() => true),
        success: () => dialogService.open = {
            title: 'Benutzer ausgeloggt',
            content: [`Der Benutzer ${name} wurde erfolgreich von allen Geräten ausgeloggt.`]
        }
    }
}

</script>