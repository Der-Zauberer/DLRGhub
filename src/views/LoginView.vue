<template>

    <form class="container-sm grid-cols-1" @submit.prevent="login()">

        <swd-dropdown>
            <swd-input>
                <label for="login-server">Server</label>
                <input id="login-server" type="button" value="local" v-model="credentials.profile">
            </swd-input>
            <swd-dropdown-content>
                <swd-selection>
                    <a>local</a>
                    <a>production</a>
                </swd-selection>
            </swd-dropdown-content>
        </swd-dropdown>

        <swd-input>
            <label for="login-username">Username</label>
            <input id="login-username" v-model="credentials.username">
        </swd-input>

        <swd-input>
            <label for="login-password">Password</label>
            <input id="login-passord" type="password" v-model="credentials.password">
        </swd-input>

        <div class="red-text">{{ error }}</div>

        <input type="submit" value="Login">
    </form>

</template>

<script setup lang="ts">
import { profiles } from '@/core/profiles';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealDbService') as SurrealDbService

const credentials = reactive({ profile: 'local', username: '', password: ''})
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    error.value = undefined
    try {
        if (credentials.profile !== 'local') await surrealdb.reconnect(profiles[credentials.profile])
        await surrealdb.signin(credentials)
        await surrealdb.redirectPostLogin()
        error.value = undefined
    } catch (exception) {
        console.log(exception)
        error.value = surrealdb.parseCustomSurrealDbError(exception).key
    } finally {
        loading.value = false
    }
}

</script>