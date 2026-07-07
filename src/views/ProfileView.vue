<template>

    <div class="container-xl">

        <h2>Profileinstellungen</h2>

        <OfflineComponent :loading="user.loading" @reload="user.reload()"/>
        <dlrg-error v-if="user?.status === 'ERROR' && parseCustomSurrealDbError(user.error).key !== 'error.connection'">{{ user?.error }}</dlrg-error>
        <swd-loading-spinner v-if="user?.status === 'LOADING' && !user?.value" class="width-100" loading="true"></swd-loading-spinner>

        <div class="grid-cols-md-2 grid-cols-1" v-if="user.value">
            <div>
                {{ user.value.name }}
                <swd-subtitle>Benutzername</swd-subtitle>
            </div>
            <div>
                {{ user.value.email }}
                <swd-subtitle>Email</swd-subtitle>
            </div>
            <div>
                {{ user.value.displayname }}
                <swd-subtitle>Anzeigename</swd-subtitle>
            </div>
            <div v-if="user.value.login">
                {{ user.value.login.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                <swd-subtitle>Letzter Login</swd-subtitle>
            </div>
        </div>

        <div class="flex">
            <button class="margin-left-auto" @click="surreal.invalidate(), surreal.redirectPostInvalidate()">Ausloggen</button>
            <button @click="dialog.open = { title: 'Ausloggen', content: [`Willst du dich wirklich von allen Geräten ausloggen?`], action: 'Ausloggen', filter: async () => surreal.invalidateAllDevices().then((() => true)), success: () => surreal.redirectPostInvalidate()}">Ausloggen von allen Geräten</button>
        </div>

        <h2>Passwort ändern</h2>

        <form @submit.prevent="changePassword()">
            <div class="grid-cols-md-3 grid-cols-1">
                <InputComponent label="Altes Passwort" type="password" v-model="password.old"/>
                <InputComponent label="Neues Passwort" type="password" v-model="password.new"/>
                <InputComponent label="Neues Passwort wiederholen" type="password" v-model="password.repeat"/>
            </div>

            <div class="flex">
                <div v-if="password.success" class="green-text">Passwort erfolgreich geändert</div>
                <div v-if="password.error" class="red-text">{{ password.error }}</div>
                <button class="margin-left-auto">Passwort ändern</button>
            </div>
            
        </form>

        <h2>Credits</h2>
    
        <div class="grid-cols-1">
            <div>Fabian Döller <a target="_blank" href="https://github.com/FabiTheGuy">GitHub</a><swd-subtitle>Darstellung Wetterdaten</swd-subtitle></div>
            <div>André Sommer <a target="_blank" href="https://github.com/Der-Zauberer">GitHub</a><swd-subtitle>Allgemeine Entwicklung</swd-subtitle></div>
            <div>Das Projekt ist Open Source und steht auf <a target="_blank" href="https://github.com/Der-Zauberer/DLRGhub">GitHub</a> zur Mitarbeit zur Verfügung!</div>
        </div>

        <h2>Rechtliches</h2>
        <div class="grid-cols-1">
            <ButtonLinkComponent :to="{ name: 'imprint' }">Impressum</ButtonLinkComponent>
            <ButtonLinkComponent :to="{ name: 'privacy-policy' }">Datenschutzerklärung</ButtonLinkComponent>
        </div>

        <h2>
            <div class="flex flex-space-between">
                Entwickleroptionen
                <ButtonComponent :icon="devtools ? 'down' : 'right'" color="ELEMENT"  @click="devtools = !devtools"/>
            </div>
        </h2>

        <div class="grid-cols-1" v-if="devtools">
            <p>
                {{ profiles.default.name }}<br>
                {{ profiles.default.address }}<br>
                {{ profiles.default.namespace }}:{{ profiles.default.database }} ({{ profiles.default.access }})<br>
                <swd-subtitle>Profil</swd-subtitle>
            </p>
            <p>
                {{ user.value?.id || 'unauthenticated' }}<br>
                <swd-subtitle>Benutzer</swd-subtitle>
            </p>
            <p>
                {{ surreal.status }}<br>
                <swd-subtitle>DB Status</swd-subtitle>
            </p>
            <p>
                {{ $dataService.online }}<br>
                <swd-subtitle>Service Worker Online</swd-subtitle>
            </p>
            <div class="flex flex-wrap">
                <button @click="$surrealDbService.close()">Verbindung trennen</button>
                <button @click="$surrealDbService.autoConnect()">Neu verbinden</button>
                <button @click="$dataService.clearCache()">Cache leeren</button>
            </div>
        </div>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { useDataService } from '@/services/data.service'
import { useDialogService } from '@/services/dialog.service'
import { parseCustomSurrealDbError, useSurrealDbService, type PasswordChangeRequest } from '@/services/surrealdb.service'
import { reactive, ref, type Ref } from 'vue'

const dialog = useDialogService()
const surreal = useSurrealDbService()
const data = useDataService()
const profiles = surreal.getProfile()
const user = data.getUser()

const devtools: Ref<boolean> = ref(false)
const password = reactive<PasswordChangeRequest & { error?: string } & { success?: boolean }>({ username: '' , old: '', new: '', repeat: '' })

async function changePassword() {
    try {
        await surreal.changePassword({ ...password, username: user.value?.name || ''})
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