<template>
  
	<div class="container-xl">

		<div class="grid-cols-md-3 grid-cols-1">
			<div class="grid-cols-1">

				<RouterLink :to="{ name: 'weather' }" style="text-decoration: none;">
					<swd-card class="swd-card-hover margin-bottom-0">
						<HeadlineComponent title="Wetter" subtitle="Gailingen am Hochrhein"><swd-icon class="right-icon"></swd-icon></HeadlineComponent>

						<div class="flex flex-wrap flex-space-between">

							<div class="weather-preview">
								<swd-icon class="weather-icon weather-preview__icon"></swd-icon>
								<div>
									<div class="weather-preview__text">{{ weather.value?.current.temperature_2m.toFixed(1) }}°</div>
									<swd-subtitle>T: {{ Math.round(weather.value?.daily.temperature_2m_min[0] || 0) }}° H: {{ Math.round(weather.value?.daily.temperature_2m_max[0] || 0) }}°</swd-subtitle>
								</div>
							</div>

							<div class="weather-preview">
								<swd-icon class="water-icon weather-preview__icon"></swd-icon>
								<div class="weather-preview__text">{{ water.value?.temperature[water.value?.temperature.length - 1 || 0].toFixed(1) }}°</div>
							</div>

						</div>
					</swd-card>
				</RouterLink>

				<swd-card v-if="pwa">
					<h3>Installieren</h3>
					<p>Du kannst diese App installieren um die auch offline benuten zu können.</p>
					<button class="width-100" @click="install()">Install</button>
				</swd-card>

				<ButtonComponent :to="{ name: 'post-edit', params: { id: 'new' } }" color="ELEMENT" icon="add" class="width-100">Posten</ButtonComponent>

			</div>
			<div class="grid-span-md-2 grid-span-1">

				<dlrg-error v-if="posts?.status === 'ERROR'">{{ posts?.error }}</dlrg-error>
				<swd-loading-spinner v-if="posts?.status === 'LOADING' && !posts?.value" class="width-100" loading="true"></swd-loading-spinner>

				<swd-card v-for="post in posts.value">
					<HeadlineComponent :title="post.title" :subtitle="post.author">
						<ButtonComponent :to="{ name: 'post-edit', params: { id: post.id.id.toString() } }" color="ELEMENT" icon="pen" aria-label="Edit" />
					</HeadlineComponent>
					<div style="white-space: pre-wrap;">{{ post.message }}</div>
				</swd-card>

			</div>
		</div>

	</div>

</template>

<script setup lang="ts">
import AppointmentComponent from '@/components/AppointmentComponent.vue';
import ButtonComponent from '@/components/ButtonComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import { resource } from '@/core/resource';
import type { BeforeInstallPromptEvent, Post} from '@/core/types';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject, onBeforeUnmount } from 'vue';

const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService
const dataService = inject(DATA_SERVICE) as DataService
const pwa = (window as unknown as {pwa: BeforeInstallPromptEvent | undefined}).pwa

function install() {
    if (pwa) {
		pwa.prompt()
		pwa.userChoice.finally(() => {})
    }
}

const posts = resource({
	loader: () => surreal.select<Post>('post')
})

const weather = dataService.getWeather()
const water = dataService.getWaterTemperature()
const shifts = dataService.getPersonShift(dataService.profileName.value, new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

</script>