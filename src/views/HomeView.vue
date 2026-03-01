<template>
  
	<div class="container-xl">

		<div class="grid-cols-md-3 grid-cols-1">
			<div class="grid-cols-1 margin-bottom">

				<RouterLink :to="{ name: 'weather' }" style="text-decoration: none;">
					<WeatherComponent :weather="weather" :water="water" :link="true"/>
				</RouterLink>

				<swd-card v-if="pwa">
					<h3>Installieren</h3>
					<p>Du kannst diese App installieren um die auch offline benuten zu können.</p>
					<button class="width-100" @click="install()">Install</button>
				</swd-card>

				<ButtonComponent :to="{ name: 'post-edit', params: { id: 'new' } }" color="ELEMENT" icon="add" class="width-100">Neuer Post</ButtonComponent>
				<ButtonComponent :to="{ name: 'user' }" color="ELEMENT" icon="user" class="width-100" v-if="user.value?.admin">Benutzerverwaltung</ButtonComponent>
				<ButtonComponent :to="{ name: 'registrations' }" color="ELEMENT" icon="user" class="width-100" v-if="user.value?.admin">Registrierungen <swd-chip class="margin-left-auto red-color" v-if="openRegistrations?.value !== 0">{{ openRegistrations.value }}</swd-chip></ButtonComponent>

			</div>
			<div class="grid-span-md-2 grid-span-1">

				<OfflineComponent v-if="parseCustomSurrealDbError(posts.error).key === 'error.connection'" :loading="posts.loading" @reload="posts.reload()"/>
				<dlrg-empty v-if="posts?.status === 'EMPTY'">Keine Posts gefunden!</dlrg-empty>
				<dlrg-error v-if="posts?.status === 'ERROR' && parseCustomSurrealDbError(posts.error).key !== 'error.connection'">{{ posts?.error }}</dlrg-error>				
				<swd-loading-spinner v-if="posts?.status === 'LOADING' && !posts?.value" class="width-100" loading="true"></swd-loading-spinner>

				<swd-card v-for="post in posts.value">
					<HeadlineComponent :title="post.title" :subtitle="post.author.displayname">
						<ButtonComponent v-if="user.value?.admin || user.value?.id.equals(post.author.id)" :to="{ name: 'post-edit', params: { id: post.id.id.toString() } }" color="ELEMENT" icon="pen" aria-label="Edit" />
					</HeadlineComponent>
					<div style="white-space: pre-wrap;">{{ post.message }}</div>
				</swd-card>

			</div>
		</div>

	</div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import WeatherComponent from '@/components/WeatherComponent.vue'
import { resource } from '@/core/resource'
import type { BeforeInstallPromptEvent} from '@/core/types'
import { DATA_SERVICE, DataService } from '@/services/data.service'
import { parseCustomSurrealDbError, SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { surql } from 'surrealdb'
import { inject, onBeforeUnmount } from 'vue'

const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService
const dataService = inject(DATA_SERVICE) as DataService
const user = dataService.getUser()
const pwa = (window as unknown as {pwa: BeforeInstallPromptEvent | undefined}).pwa

const openRegistrations = resource({
	parameter: user,
	loader: () => surreal.up().then(() => surreal.query<[Number]>(surql`(SELECT count() FROM registration GROUP ALL)[0].count`).then(result => result[0]))
})

function install() {
    if (pwa) {
		pwa.prompt()
		pwa.userChoice.finally(() => {})
    }
}

const posts = dataService.getPosts(new Promise<void>(resolve => onBeforeUnmount(() => resolve())))
const weather = dataService.getWeather()
const water = dataService.getWaterTemperature()

</script>