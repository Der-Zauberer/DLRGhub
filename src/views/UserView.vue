<template>

    <div class="container-xl">

        <HeadlineComponent :back="{ name: 'home' }" title="Benutzer">
            <ButtonComponent :to="{ name: 'user-edit', params: { id: 'new' } }" color="ELEMENT" icon="add" aria-label="add"/>
        </HeadlineComponent>

        <dlrg-empty v-if="user?.status === 'EMPTY'">Keine Benutzer gefunden!</dlrg-empty>
        <dlrg-error v-if="user?.status === 'ERROR'">{{ user?.error }}</dlrg-error>
        <swd-loading-spinner v-if="user?.status === 'LOADING' && !user?.value" class="width-100" loading="true"></swd-loading-spinner>

        <div class="grid-cols-1">
            <ButtonLinkComponent v-for="account in user.value" :to="{ name: 'user-edit', params: { id: account.id.id.toString() } }">
                <span>
                    {{ account.displayname }}
                    <swd-subtitle>{{ account.name }}</swd-subtitle>
                    <swd-subtitle>{{ account.email }}</swd-subtitle>
                </span>
                <swd-chip class="red-color" v-if="account.admin">Admin</swd-chip>
                <swd-chip class="red-color" v-if="!account.account.enabled">Disabled</swd-chip>
                <swd-chip class="red-color" v-if="account.account.enabled && account.account.expiry && account.account.expiry < new Date()">Expired</swd-chip>
            </ButtonLinkComponent>
        </div>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import { resource } from '@/core/resource';
import type { User } from '@/core/types';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject } from 'vue';

const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService

const user = resource({
    loader: surreal.select<User>('user')
})

</script>