<template>

    <form class="container-sm grid-cols-1" @submit.prevent="login()">
        <input v-model="credentials.username">

        <input type="password" v-model="credentials.password">

        <input type="submit">
    </form>

</template>

<script setup lang="ts">
import type { SurrealDbService } from '@/services/surrealdb.service';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealDbService') as SurrealDbService

const credentials = reactive({ username: '', password: '' })
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    try {
        await surrealdb.signinAndRedirect(credentials)
        await surrealdb.redirectPostLogin()
        error.value = undefined
    } catch (exception) {
        error.value = surrealdb.parseCustomSurrealDbError(exception).key
    } finally {
        loading.value = false
    }
}

</script>