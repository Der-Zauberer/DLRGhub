<template>

    <div class="container-xl">

        <HeadlineComponent :title="user.value?.name || 'Unbenannt'" :resource="user" :back="{ name: 'user' }">
            <ButtonComponent v-if="user.value && route.params.id !== 'new'" icon="delete" @click="userDeleteDialog = true">Löschen</ButtonComponent>
            <DialogComponent v-if="user.value" name="Dienstplan löschen" action="Löschen" v-model="userDeleteDialog" @success="deleteUser(user.value.id!)">
                <p>Bist du sicher den Benutzer zu löschen?</p>
                <code><samp class="id">{{ user.value?.id?.id }}</samp>&nbsp;{{ user.value?.name }}</code>
            </DialogComponent>
            <swd-loading-spinner :loading="saveUser.loading">
                <ButtonComponent v-if="user.value" icon="done" @click="saveUser.reload()">Speichern</ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <dlrg-error v-if="user?.status === 'ERROR' || saveUser?.status === 'ERROR'">{{ user?.error || saveUser?.error }}</dlrg-error>
        <swd-loading-spinner v-if="user?.status === 'LOADING' && !user?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="user.value" ref="form">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Id" :disabled="$route.params.id !== 'new'" v-model="user.value.id!.id"/>
                <InputComponent label="Name" v-model="user.value.name" required/>
                <InputComponent label="Email" type="email" v-model="user.value.email" required/>
                <InputComponent label="Admin" type="checkbox" v-model="user.value.admin"/>
                <InputComponent label="Aktiviert" type="checkbox" v-model="user.value.account!.enabled"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.account!.expiry)" @input="user.value.account!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
            </div>

            <h6>Zugangsdaten</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Änderung erzwingen" type="checkbox" v-model="user.value.credentials!.change"/>
                <InputComponent label="Ablauf" type="date" :value="dateToIsoDate(user.value.credentials!.expiry)" @input="user.value.credentials!.expiry = isoDateToDate(($event.target as HTMLInputElement).value)"/>
                <InputComponent label="Passwort setzen" type="password" v-model="user.value.password"/>
            </div>

        </form>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import DialogComponent from '@/components/DialogComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { User } from '@/core/types';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { RecordId, surql, Table } from 'surrealdb';
import { inject, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const userDeleteDialog = ref<boolean>(false)

const newUser: Partial<User> = {
    id: new RecordId('user', ''),
    admin: false,
    account: {
        enabled: false
    },
    credentials: {
        change: false
    }
}

const user = resource({
    loader: () => route.params.id === 'new' ? { ...newUser } : surreal.select<Partial<User>>(new RecordId('user', route.params.id))
})

const saveUser = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !user.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }

        if (route.params.id === 'new') {
            if (!user.value.id?.id) delete user.value.id
            await surreal.insert(new Table('user'), user.value)
        } else {
            await surreal.query(surql`UPDATE ONLY ${user.value.id} MERGE ${user.value}`)
        }
        
        router.push({ name: 'user' })
    }
})

async function deleteUser(id: RecordId<'user'>) {
    await surreal.delete(id)
    router.push({ name: 'user' })
}

function dateToIsoDate(date?: Date): string | undefined {
    return date ? date.toISOString().split('T')[0] : undefined
}

function isoDateToDate(string?: string): Date | undefined {
    return string && string.match(/\d{4}-\d{2}-\d{2}/g) ? new Date(string) : undefined
}

</script>