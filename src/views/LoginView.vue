<template>
    
    <div class="login">

        <form v-if="$route.name === 'login' && !passwordChange" class="login__form" @submit.prevent="login()">

            <h3>Mitglieder Login</h3>

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

        <form v-if="$route.name === 'login' && passwordChange" @submit.prevent="changePassword(passwordChange)">

            <h3>Passwort ändern</h3>
            <p>Dein Passwort muss geändert werden!</p>

            <InputComponent label="Altes Passwort" type="password" v-model.lazy="passwordChange.old" :invalid="registrationError == ERROR['error.user.password.invalid']"/>
            <InputComponent label="Neue Passwort" type="password" v-model.lazy="passwordChange.new" :invalid="registrationError == ERROR['error.user.password.change.different']"/>
            <InputComponent label="Passwort Wiederhohlen" type="password" v-model.lazy="passwordChange.repeat" :invalid="registrationError == ERROR['error.user.password.change.repeat']"/>
                
            <p class="red-text" v-if="loginError">{{ loginError }}</p>

            <div class="flex flex-end margin-0">
                <input class="width-100" type="submit" value="Passwort ändern">
            </div>

        </form>

        <form v-if="$route.name === 'register' && !registrationSuccess" class="login__form" @submit.prevent="register()">
            
            <h3 class="margin-0">Mitglieder Registrierung</h3>

            <InputComponent label="Email" type="email" v-model="registration.email" required/>
            <div class="grid-cols-md-2 grid-cols-1">
                <InputComponent label="Vorname" v-model="registration.firstname" required/>
                <InputComponent label="Nachname" v-model="registration.lastname"/>
            </div>
            <InputComponent label="Password" type="password" v-model="registration.password" required/>
            <InputComponent label="Passwort Wiederhohlen" type="password" v-model="passwordRepeat" required :invalid="registrationError == ERROR['error.user.password.change.repeat']"/>

            <div class="flex">
                <input type="checkbox" required style="min-height: 1.5em; min-width: 1.5em;">
                <p>Ich habe die <RouterLink :to="{ name: 'privacy-policy' }">Datenschutzerklärung</RouterLink> gelesen und habe dabei die Luft länger angehalten als beim 25-Meter tauchen. Ich stimme zu!</p>
            </div>

            <div class="red-text" v-if="registrationError">{{ registrationError }}</div>

            <swd-loading-spinner :loading="registrationLoading" class="width-100">
                <input type="submit" value="Registrierung abschließen" class="width-100">
            </swd-loading-spinner>
        </form>

        <form v-if="$route.name === 'register' && registrationSuccess" class="login__form" @submit.prevent="register()">
            
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

        <footer class="grey-text">
            <RouterLink :to="{ name: 'register' }">Registrieren</RouterLink>
            <a target="_blank" href="/imprint">Impressum</a>
            <a target="_blank" href="/privacy-policy">Datenschuterklärung</a>
        </footer>

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
    z-index: 3;
    top: 0;
    min-height: 100dvh;
    min-width: 100vw;
    padding: calc(var(--theme-element-spacing) * 2);
    padding-bottom: calc(var(--theme-element-spacing) * 2 + 1em);
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
        --theme-element-spacing: var(--theme-inner-element-spacing);
        margin: 0;
    }
}

@media only screen and (max-width: 575px) {
    .login form { width: 100% }
    .login { padding: var(--theme-element-spacing); padding-bottom: calc(var(--theme-element-spacing) + 1em); }
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

footer {
    position: absolute;
    bottom: 0.3em;
    right: 1ch;
    display: flex;
    gap: 1ch;
    justify-content: end;
}

</style>

<script setup lang="ts">
import InputComponent from '@/components/InputComponent.vue'
import type { Registration } from '@/core/types'
import { config, normalize, parseCustomSurrealDbError, SURREAL_DB_SERVICE, type PasswordChangeRequest, type SurrealDbService } from '@/services/surrealdb.service'
import { Table } from 'surrealdb'
import { inject, reactive, ref } from 'vue'

const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profiles = surrealdb.getProfile()

const credentials = reactive({ profile: profiles.default.name, username: '', password: ''})
const passwordChange = ref<PasswordChangeRequest>()
const loginLoading = ref<boolean>()
const loginError = ref<string>()

const ERROR: Record<string, string> = {
    'error.connection': 'Verbindung zum Anmeldeserver konnte nicht hergestellt werden!',
    'error.user.deactivated': 'Dein Benutzerkonto ist deaktiviert',
    'error.user.password.invalid': 'Dein Benutzername oder Passwort ist falsch!',
    'error.user.password.change.required': 'Dein Passwort muss geändert werden!',
    'error.user.password.change.repeat': 'Das wiederhohlte Passwort muss mit dem neuen Passwort übereinstimmen!',
    'error.user.password.change.different': 'Das neue Passwort muss anders sein als das alte!'
}

async function login() {
    loginLoading.value = true
    loginError.value = undefined
    try {
        await surrealdb.up(credentials.profile !== profiles.default.name ? profiles.profiles.find(profile => credentials.profile == profile.name) : undefined, true)
        await surrealdb.signin(credentials)
        await surrealdb.redirectPostLogin()
        loginError.value = undefined
    } catch (exception) {
        const dbError = parseCustomSurrealDbError(exception as Error)
        if (dbError.success && dbError.key === 'error.user.password.change.required') {
            passwordChange.value = { username: credentials.username, old: '', new: '', repeat: '' }
            loginError.value = undefined
        } else {
            const key = parseCustomSurrealDbError(exception as Error).key
            loginError.value = key ? ERROR[key] || key : key
        }
    } finally {
        loginLoading.value = false
    }
}

async function changePassword(credentials: PasswordChangeRequest) {
    loginLoading.value = true
    try {
        await surrealdb.changePassword(credentials)
        await surrealdb.redirectPostLogin()
        passwordChange.value = undefined
    } catch (exception) {
        const key = parseCustomSurrealDbError(exception as Error).key
        loginError.value = key ? ERROR[key] || key : key
    } finally {
        loginLoading.value = false
    }
}

const registration = reactive<Partial<Registration>>({})
const passwordRepeat = ref<string>('')
const registrationSuccess = ref<boolean>(false)
const registrationLoading = ref<boolean>()
const registrationError = ref<string>()

async function register() {
    if (registration.password !== passwordRepeat.value) {
        registrationError.value = ERROR['error.user.password.change.repeat']
        return
    }
    registrationLoading.value = true
    registrationError.value = undefined
    try {
        await surrealdb.up()
        registrationSuccess.value = await surrealdb.insert(new Table('registration'), registration).then(() => true)
        loginError.value = undefined
    } catch (exception) {
        registrationError.value = parseCustomSurrealDbError(exception as Error).key
    } finally {
        registrationLoading.value = false
    }
}

</script>