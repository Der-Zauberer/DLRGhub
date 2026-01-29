<template>

    <div class="container-xl">

        <h3>Profileinstellungen</h3>

        <InputComponent class="margin-bottom" label="Name" placeholder="Max Mustermann" v-model.lazy="$dataService.profileName.value"/>

        <swd-card>
            Dein Name wird lokal gespeichert und wird verwendet um anzuzeigen, für welche Schichten du eingeteilt bist. Dazu muss der Name exakt mit den Namen in den Schichten übereinstimmen.
        </swd-card>

        <div class="grid-cols-md-2 grid-cols-1">
            <InputComponent label="Benutzername" disabled :value="user?.name"/>
            <InputComponent label="Email" type="email" disabled :value="user?.email"/>
            <InputComponent label="Anzeigename" disabled :value="user?.displayname"/>
            <div>
                {{ user?.login?.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                <swd-subtitle>Letzter Login</swd-subtitle>
            </div>
        </div>

        <div class="flex">
            <button @click="surrealdb.invalidate(), surrealdb.redirectPostInvalidate()">Ausloggen</button>
            <button @click="dialog.open = { name: 'Ausloggen', content: `Willst du dich wirklich von allen Geräten ausloggen?`, action: 'Ausloggen', filter: async () => surrealdb.invalidateAllDevices().then((() => true)), success: () => surrealdb.redirectPostInvalidate()}">Ausloggen von allen Geräten</button>
        </div>

        <h3>Passwort ändern</h3>

        <form @submit.prevent="changePassword()">
            <div class="grid-cols-md-3 grid-cols-1">
                <InputComponent label="Altes Passwort" type="password" v-model="password.old"/>
                <InputComponent label="Neues Passwort" type="password" v-model="password.new"/>
                <InputComponent label="Neues Passwort wiederholen" type="password" v-model="password.repeat"/>
            </div>

            <div :class="password.success || password.error ? 'flex' : undefined">
                <div v-if="password.success" class="green-text">Passwort erfolgreich geändert</div>
                <div v-if="password.error" class="red-text">{{ password.error }}</div>
                <button class="margin-left-auto">Passwort ändern</button>
            </div>
            
        </form>

        <h3>
            <div class="flex flex-space-between">
                Entwickleroptionen
                <ButtonComponent :icon="devtools ? 'down' : 'right'" color="ELEMENT"  @click="devtools = !devtools"/>
            </div>
        </h3>

        <div class="grid-cols-1" v-if="devtools">

            <p>
                {{ profiles.default.name }}<br>
                {{ profiles.default.address }}<br>
                {{ profiles.default.namespace }}:{{ profiles.default.database }} ({{ profiles.default.access }})<br>
                <swd-subtitle>Profil</swd-subtitle>
            </p>

            <p>
                {{ user?.id || 'unauthenticated' }}<br>
                <swd-subtitle>Benutzer</swd-subtitle>
            </p>

            <p>
                {{ surrealdb.status }}<br>
                <swd-subtitle>DB Status</swd-subtitle>
            </p>

            <p>
                {{ $dataService.online }}<br>
                <swd-subtitle>Service Worker Online</swd-subtitle>
            </p>

            <div class="flex">
                <button @click="$surrealDbService.close()">Disconnect</button>
                <button @click="$surrealDbService.autoConnect()">Reconnect</button>
                <button @click="$dataService.clearCache()">Clear Cache</button>
            </div>

        </div>
    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { User } from '@/core/types'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService, type PasswordChangeRequest } from '@/services/surrealdb.service'
import { inject, reactive, ref, type Ref } from 'vue'

const dialog = inject(DIALOG_SERVICE) as DialogService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()
const user = surrealdb.getUserAsRef()

const devtools: Ref<boolean> = ref(false)
const password = reactive<PasswordChangeRequest & { error?: string } & { success?: boolean }>({ username: '' , old: '', new: '', repeat: '' })

const profile = resource({
    loader: () => surrealdb.info<User>()
})

async function changePassword() {
    try {
        await surrealdb.changePassword({ ...password, username: profile.value?.name || ''})
        password.old = ''
        password.new = ''
        password.repeat = ''
        delete password.error
        password.success = true
    } catch (exception) {
        const dbError = parseCustomSurrealDbError(exception as Error)
        password.error = dbError.success ? dbError.message : dbError.key
        password.success = false
    }
}

</script>