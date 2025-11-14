<template>
  
  <div class="container-xl">
    <button v-if="pwa" @click="install()">Install</button>

    <h3>Features TODO</h3>
    <ul>
      <li>PDF Document Handling</li>
      <li>Rich Text Editing</li>
      <li>Post Polls</li>
      <li>Post Appointments</li>
    </ul>

    <h3>Improvements TODO</h3>
    <ul>
      <li>Form Action Bar Layout</li>
      <li>Form Tables</li>
      <li>Card Fontsize</li>
      <li>Form Error Handling</li>
      <li>Reconnect (Offline Reconnect / Database Reconnect)</li>
      <li>Ignore Past Shifts</li>
      <li>Shift Snippet Layout</li>
      <li>Shift Layout</li>
      <li>Shift Edit</li>
    </ul>

    <RouterLink :to="{ name: 'post-edit', params: { id: 'new' } }">Post</RouterLink>
    <swd-card v-for="post in posts.value">
      <h4>
        {{ post.title }}
        <swd-subtitle>{{ post.author }}</swd-subtitle>
      </h4>
      <div>{{ post.message }}</div>
      <RouterLink :to="{ name: 'post-edit', params: { id: post.id.id.toString() } }">Edit</RouterLink>
    </swd-card>

  </div>

</template>

<script setup lang="ts">
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