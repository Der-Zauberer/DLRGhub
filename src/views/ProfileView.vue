<template>

    <div class="container-xl">

        <h3>Profileinstellungen</h3>

        <InputComponent class="margin-bottom" label="Name" placeholder="Max Mustermann" v-model.lazy="$dataService.profileName.value"/>

        <swd-card>
            Dein Name wird lokal gespeichert und wird verwendet um anzuzeigen, für welche Schichten du eingeteilt bist. Dazu muss der Name exakt mit den Namen in den Schichten übereinstimmen.
        </swd-card>

        <button @click="$surrealDbService.invalidate(), $surrealDbService.redirectPostInvalidate()">Logout</button>

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
import ButtonComponent from '@/components/ButtonComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject, ref, type Ref } from 'vue';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()
const user = surrealdb.getUserAsRef()

const devtools: Ref<boolean> = ref(false)

</script>