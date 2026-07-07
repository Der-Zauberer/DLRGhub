<template>

    <div v-if="!route.params.id" class="container-xl">

        <HeadlineComponent :back="{ name: 'home' }" title="Benutzer"/>

        <OfflineComponent :loading="users.loading" @reload="users.reload()"/>
        <dlrg-error v-if="(users?.status === 'ERROR' && parseCustomSurrealDbError(users.error).key !== 'error.connection')">{{ users?.error }}</dlrg-error>

        <TableComponent :modelValue="parameter" @update:modelValue="Object.assign(parameter, $event)" :resource="users" :header="[ 'Name', 'Email', 'Status', 'Letzter Login' ]">
            <a v-for="user of users.value" :key="user.id.id.toString()" @click="router.push({ name: 'user-edit', params: { id: user.id.id.toString() } })">
                <div>{{ user.displayname }}</div>
                <div>{{ user.name }} <swd-chip class="red-color" v-if="user.admin">Admin</swd-chip><swd-subtitle>{{ user.email }}</swd-subtitle></div>
                <div>
                    <swd-chip class="green-color" v-if="user.account.enabled && !(user.account.expiry && user.account.expiry < new Date())">Aktiviert</swd-chip>
                    <swd-chip class="red-color" v-if="!user.account.enabled">Deaktiviert</swd-chip>
                    <swd-chip class="red-color" v-if="user.account.enabled && user.account.expiry && user.account.expiry < new Date()">Abgelaufen</swd-chip>
                    <swd-subtitle v-if="user.account.expiry">{{ user.account.expiry?.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</swd-subtitle>
                </div>
                <div>{{ user.login?.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</div>
            </a>
        </TableComponent>

    </div>

    <div v-if="route.params.id" class="container-xl">

        <HeadlineComponent :title="user.value?.displayname || 'Unbenannt'" :resource="user" :back="{ name: 'user' }">
            <ButtonComponent v-if="user.value && route.params.id !== 'new'" icon="delete" @click="openDeleteDialog(user.value as User)"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <swd-loading-spinner :loading="saveUser.loading">
                <ButtonComponent v-if="user.value" icon="done" @click="saveUser.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <OfflineComponent v-if="parseCustomSurrealDbError(user.error).key === 'error.connection'" :loading="user.loading" @reload="user.reload()"/>
        <dlrg-error v-if="(user?.status === 'ERROR' && parseCustomSurrealDbError(user.error).key !== 'error.connection') || saveUser?.status === 'ERROR'">{{ user?.error || saveUser?.error }}</dlrg-error>
        <swd-loading-spinner v-if="user?.status === 'LOADING' && !user?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="user.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Id" :disabled="$route.params.id !== 'new'" v-model="userId"/>
                <InputComponent label="Email" type="email" v-model="user.value.email" required/>
                <InputComponent label="Name" v-model="user.value.name" required/>
                <InputComponent label="Anzeigename" v-model="user.value.displayname" required/>
                <InputComponent label="Aktiviert" type="checkbox" v-model="user.value.account!.enabled"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.account!.expiry)" @input="user.value.account!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
            </div>
            
            <h6>Rolle</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Admin" type="checkbox" v-model="user.value.admin"/>
            </div>

            <h6>Zugangsdaten</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Änderung erzwingen" type="checkbox" v-model="user.value.credentials!.change"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.credentials!.expiry)" @input="user.value.credentials!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
                <InputComponent label="Passwort setzen" type="password" v-model="user.value.password" :required="$route.params.id === 'new'"/>
                <button v-if="user.value" @click.prevent="logoutFromAllDevices(user.value.id!, user.value.name!)">Ausloggen von allen Geräten</button>
            </div>

            <h6>Sicherheitsinformationen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <div v-if="user.value.login">
                    {{ user.value.login.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    <swd-subtitle>Letzter Login</swd-subtitle>
                </div>
                <div v-if="user.value.account?.valid">
                    {{ user.value.account?.valid.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    <swd-subtitle>Sessions gültig seit</swd-subtitle>
                </div>
            </div>

        </form>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import TableComponent, { type TableParameter } from '@/components/TableComponent.vue'
import { resource } from '@/core/resource'
import type { User } from '@/core/types'
import { dateToIsoDate, isoDateToDate } from '@/services/data.service'
import { useDialogService } from '@/services/dialog.service'
import { parseCustomSurrealDbError, useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql, Table } from 'surrealdb'
import { markRaw, reactive, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const dialog = useDialogService()
const surreal = useSurrealDbService()

const parameter = reactive<TableParameter>({ search: '', page: 1, size: 100, count: 0 })
const users = resource({
    parameter,
	loader: async (parameter) => {
        await surreal.up()
        const [result, count] = await surreal.query<[User[], number]>(`SELECT * FROM user ${parameter.search ? 'WHERE name.lowercase().starts_with($search.lowercase())' : ''} ORDER BY name START ($page - 1) * $size LIMIT $size; (SELECT count() FROM user ${parameter.search ? 'WHERE name CONTAINS $search' : ''} GROUP ALL)[0].count`, parameter)
        parameter.count = count
        return result
    }
})

const formRef = useTemplateRef('form')

const newUser: Partial<User> = {
    admin: false,
    account: {
        enabled: false
    },
    credentials: {
        change: false
    }
}

const userId = ref<string>()
const user = resource({
    parameter: { route },
    loader: async parameter => {
        if (!parameter.route.params.id) return undefined
        const result = route.params.id === 'new' ? { ...newUser as User } : await surreal.up().then(() => surreal.select<User>(new RecordId('user', route.params.id)))
        userId.value = result?.id?.id?.toString()
        return result
    }
})

const saveUser = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !user.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }
        await surreal.up()
        if (route.params.id === 'new') {
            if (userId.value) user.value.id = markRaw(new RecordId('user', userId.value))
            await surreal.insert(new Table('user'), user.value)
        } else {
            await surreal.query(surql`UPDATE ONLY ${user.value.id} MERGE ${user.value}`)
        }
        
        router.push({ name: 'user' })
    }
})

function openDeleteDialog(user: User) {
    dialog.open = {
        title: 'Benutzer löschen',
        content: ['Bist du sicher den Benutzer zu löschen?', `<swd-card>${user.displayname}<swd-subtitle>${user.name}</swd-subtitle><swd-subtitle>${user.email}</swd-subtitle></swd-card>`],
        action: 'Löschen',
        filter: () => surreal.up().then(() => surreal.delete(user.id)).then(() => true),
        success: () => router.push({ name: 'user' })
    }
}

async function logoutFromAllDevices(id: RecordId<'user'>, name: string) {
    dialog.open = {
        title: 'Benutzer ausloggen',
        content: [`Soll der Benutzer ${name} von allen Geräten ausgeloggt werden?`],
        action: 'Ausloggen',
        filter: async () => await surreal.up().then(() => surreal.query(surql`UPDATE ${id} SET account.valid = ${new Date()}`)).then(() => true),
        success: () => dialog.open = {
            title: 'Benutzer ausgeloggt',
            content: [`Der Benutzer ${name} wurde erfolgreich von allen Geräten ausgeloggt.`]
        }
    }
}

</script>