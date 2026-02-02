<template>
    
    <div class="login">

        <form v-if="$route.name === 'login'" class="login__form" @submit.prevent="login()">

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

            <div class="red-text" v-if="loginError">{{ loginError }}</div>

            <swd-loading-spinner :loading="loginLoading" class="width-100">
                <input type="submit" value="Login" class="width-100">
            </swd-loading-spinner>

        </form>

        <form v-if="$route.name === 'register' && !registration.success" class="login__form" @submit.prevent="register()">
            
            <h3 class="margin-0">Mitglieder Registrierung</h3>

            <InputComponent label="Email" type="email" v-model="registration.email" required/>
            <div class="grid-cols-md-2 grid-cols-1 margin-bottom-0">
                <InputComponent label="Vorname" v-model="registration.firstname" required/>
                <InputComponent label="Nachname" v-model="registration.lastname"/>
            </div>
            <InputComponent label="Password" type="password" v-model="registration.password" required/>

            <div class="red-text" v-if="registrationError">{{ registrationError }}</div>

            <swd-loading-spinner :loading="registrationLoading" class="width-100">
                <input type="submit" value="Registrierung abschließen" class="width-100">
            </swd-loading-spinner>
        </form>

        <form v-if="$route.name === 'register' && registration.success" class="login__form" @submit.prevent="register()">
            
            <h3 class="margin-0">Registrierung Abgeschlossen</h3>
            <div>Ein Admin muss deine Registrierung bestätigen. Danach kannst du dich mit folgenden Daten anmelden:</div>
            <div>
                Benutzername: <b>{{ normalize(registration.firstname!) }}.{{ normalize(registration.lastname!) }}</b> oder <b>{{ registration.email }}</b><br>
                Passwort: <b>****</b>
            </div>

            <div>Anzeigename: <b>{{ registration.firstname }} {{ registration.lastname }}</b>
            </div>

            <RouterLink :to="{ name: 'login' }" class="button text-center">Zurück zum Login</RouterLink>
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

    > * {
        --theme-element-spacing: var(--theme-inner-element-spacing)
    }
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
import InputComponent from '@/components/InputComponent.vue'
import type { Registration } from '@/core/types'
import { config, normalize, parseCustomSurrealDbError, SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service'
import { Table } from 'surrealdb'
import { inject, reactive, ref } from 'vue'

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()

const credentials = reactive({ profile: profiles.default.name, username: '', password: ''})
const loginLoading = ref<boolean>()
const loginError = ref<string>()

async function login() {
    loginLoading.value = true
    loginError.value = undefined
    try {
        if (credentials.profile !== profiles.default.name) await surrealdb.autoConnect(profiles.profiles.find(profile => credentials.profile == profile.name))
        await surrealdb.signin(credentials)
        await surrealdb.redirectPostLogin()
        loginError.value = undefined
    } catch (exception) {
        loginError.value = parseCustomSurrealDbError(exception as Error).key
    } finally {
        loginLoading.value = false
    }
}

const registration = reactive<Partial<Registration> & { success: boolean }>({ success: false })
const registrationLoading = ref<boolean>()
const registrationError = ref<string>()

async function register() {
    registrationLoading.value = true
    registrationError.value = undefined
    try {
        registration.success = await surrealdb.insert(new Table('registration'), registration as Registration).then(() => true)
        loginError.value = undefined
    } catch (exception) {
        registrationError.value = parseCustomSurrealDbError(exception as Error).key
    } finally {
        registrationLoading.value = false
    }
}

</script>