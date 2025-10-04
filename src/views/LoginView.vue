<template>
    
    <div class="login">

        <form class="login__form" @submit.prevent="login()">

            <h3 class="margin-0">Mitglieder Login</h3>

            <InputComponent label="Benutzername" v-model="credentials.username"/>
            <InputComponent label="Passwort" type="password" v-model="credentials.password"/>

            <swd-dropdown style="margin-left: auto;">
                <button type="button" class="link-button">Server auswählen <swd-icon class="down-icon" aria-hidden="true"></swd-icon></button>
                <swd-dropdown-content>
                    <swd-selection>
                        <a v-for="profile of config.profiles" @click="credentials.profile = profile.name">
                            <swd-icon :class="profile.name === credentials.profile ? 'done-icon' : ''"></swd-icon>
                            {{ profile.name }}
                        </a>
                    </swd-selection>
                </swd-dropdown-content>
            </swd-dropdown>

            <div class="red-text" v-if="error">{{ error }}</div>

            <swd-loading-spinner :loading="loading" class="width-100">
                <input type="submit" value="Login" class="width-100">
            </swd-loading-spinner>

        </form>

    </div>

</template>

<style>

.login {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    box-sizing: border-box;
    background: url('/resources/gallery/rhinewatch.jpg') center center / cover no-repeat;
    z-index: 10;
    top: 0;
    min-height: 100dvh;
    min-width: 100vw;
    padding: calc(var(--theme-element-spacing) * 2);
}

.login form {
    display: grid;
    box-sizing: border-box;
    gap: var(--theme-inner-element-spacing);
    width: 400px;
    background: var(--theme-background-color);
    padding: var(--theme-element-spacing);
    margin-left: auto;
    border: solid var(--theme-primary-color) var(--theme-border-width);
    border-radius: calc(var(--theme-border-radius) * 2);
}

@media only screen and (max-width: 575px) {
    .login form { width: 100% }
    .login { padding: var(--theme-element-spacing) }
}

button.link-button, button.link-button:focus, button.link-button:active {
    background: transparent;
    color: var(--theme-primary-color);
    margin: 0;
}

button.link-button:hover, button.link-button:focus, button.link-button:active {
    background: transparent;
    text-decoration: underline;
    margin: 0;
}

</style>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue';
import { config, SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()

const credentials = reactive({ profile: profiles.default.name, username: '', password: ''})
const loading = ref<boolean>()
const error = ref<string>()

async function login() {
    loading.value = true
    error.value = undefined
    try {
        if (credentials.profile !== profiles.default.name) await surrealdb.autoConnect(profiles.profiles.find(profile => credentials.profile == profile.name))
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