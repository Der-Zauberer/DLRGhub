<template>
  
  <div class="container-xl">
    <RouterLink :to="{ name: 'plans' }">Plans</RouterLink>

    <button v-if="pwa" @click="install()">Install</button>

    <button @click="open = true">open</button>

    <DialogComponent v-model="open" name="Test" action="Test">
      Test
    </DialogComponent>
    
  </div>

</template>

<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue'
import type { BeforeInstallPromptEvent } from '@/core/types';
import { ref } from 'vue';

const pwa = (window as unknown as {pwa: BeforeInstallPromptEvent | undefined}).pwa

const open = ref<boolean>(false)

function install() {
  if (pwa) {
    pwa.prompt()
    pwa.userChoice.finally(() => {})
  }
}

</script>