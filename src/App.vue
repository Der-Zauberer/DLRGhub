<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <swd-menu>
    <img src="@/assets/logo.svg" height="25px">
    <div class="vr"></div>
    <div class="client">
      <span class="secondary-text">Gruppe</span>
      <span class="secondary-text">Gailingen e.V.</span>
    </div>
  </swd-menu>

  <RouterView />
</template>

<style scoped>

.vr {
  width: 2px;
  height: 30px;
  margin: 0 8px;
  background: var(--theme-secondary-color);
}

.client {
  display: flex;
  flex-direction: column;
  line-height: 15px;
  font-size: 12px;
  color: var(--theme-secondary-color) !important;
  font-weight: bold;
}

</style>
