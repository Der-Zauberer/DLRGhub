<template>

    <div class="container-xl">

        <InputComponent class="margin-bottom" label="Name" placeholder="Max Mustermann" v-model.lazy="$dataService.profileName.value"/>

        <swd-card>
            Dein Name wird lokal gespeichert und wird verwendet um anzuzeigen, für welche Schichten du eingeteilt bist. Dazu muss der Name exakt mit den Namen in den Schichten übereinstimmen.
        </swd-card>

        <div class="flex">
            <button @click="$dataService.clearCache()">Clear Cache</button>
            <button @click="$surrealDbService.invalidate(), $surrealDbService.redirectPostInvalidate()">Logout</button>
        </div>
    </div>

</template>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue';
</script>