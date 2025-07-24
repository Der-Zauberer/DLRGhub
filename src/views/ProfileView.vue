<template>

    <div class="container-xl">
        <button @click="surrealdb.invalidate(), surrealdb.redirectPostInvalidate()">Logout</button>
    </div>

</template>

<script setup lang="ts">
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject } from 'vue';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

</script>