<template>
  
  <div class="container-xl">
    <button v-if="pwa" @click="install()">Install</button>

    <h3>TODO</h3>
    <ul>
      <li>My Shifts</li>
      <li>Edit Plan / Add Plan</li>
      <li>Profile</li>
      <li>Auth</li>
      <li>Reconnect</li>
      <li>Weather Widget</li>
      <li>Water Widget</li>
    </ul>
    
  </div>

</template>

<script setup lang="ts">
import type { BeforeInstallPromptEvent } from '@/core/types';

const pwa = (window as unknown as {pwa: BeforeInstallPromptEvent | undefined}).pwa

function install() {
  if (pwa) {
    pwa.prompt()
    pwa.userChoice.finally(() => {})
  }
}

</script>