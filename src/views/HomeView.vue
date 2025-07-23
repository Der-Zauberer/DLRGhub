<template>
  
  <div class="container-xl">
    <RouterLink :to="{ name: 'plans' }">Plans</RouterLink>

    <button v-if="pwa" @click="install()">Install</button>
  </div>

</template>

<script setup lang="ts">
import { pwa } from '@/main';

function install() {
  if (pwa) {
    pwa.prompt();
    pwa.userChoice.finally(() => {});
  }
}

</script>