<template>
  
	<div class="container-xl">
		<button v-if="pwa" @click="install()">Install</button>

		<RouterLink :to="{ name: 'post-edit', params: { id: 'new' } }">Post</RouterLink>
		<swd-card v-for="post in posts.value">
			<HeadlineComponent :title="post.title" :subtitle="post.author">
				<RouterLink :to="{ name: 'post-edit', params: { id: post.id.id.toString() } }">Edit</RouterLink>
			</HeadlineComponent>
			<div style="white-space: pre-wrap;">{{ post.message }}</div>
		</swd-card>

	</div>

</template>

<script setup lang="ts">
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import { resource } from '@/core/resource';
import type { BeforeInstallPromptEvent, Post} from '@/core/types';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
import { inject } from 'vue';

const surreal = inject(SURREAL_DB_SERVICE) as SurrealDbService
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

</script>