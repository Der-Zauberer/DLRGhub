<template>

    <div class="container-xl">

        <h3>Profileinstellungen</h3>

        <InputComponent class="margin-bottom" label="Name" placeholder="Max Mustermann" v-model.lazy="$dataService.profileName.value"/>

        <swd-card>
            Dein Name wird lokal gespeichert und wird verwendet um anzuzeigen, für welche Schichten du eingeteilt bist. Dazu muss der Name exakt mit den Namen in den Schichten übereinstimmen.
        </swd-card>

        <button @click="$surrealDbService.invalidate(), $surrealDbService.redirectPostInvalidate()">Logout</button>

        <h3>Entwickleroptionen</h3>

        <p>
            <strong>Profil</strong><br>
            {{ profiles.default.name }}<br>
            {{ profiles.default.address }}<br>
            {{ profiles.default.namespace }}:{{ profiles.default.database }} ({{ profiles.default.access }})<br>
        </p>

        <p>
            <strong>Benutzer</strong><br>
            {{ user?.id || 'unauthenticated' }}<br>
        </p>

        <p>
            <strong>DB Status</strong><br>
            {{ surrealdb.status }}<br>
        </p>

        <p>
            <strong>Service Worker Online</strong><br>
            {{ $dataService.online }}<br>
        </p>

        <div class="flex">
            <button @click="$surrealDbService.close()">Disconnect</button>
            <button @click="$surrealDbService.autoConnect()">Reconnect</button>
            <button @click="$dataService.clearCache()">Clear Cache</button>
        </div>
    </div>

</template>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject } from 'vue';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()
const user = surrealdb.getUserAsRef()

</script>