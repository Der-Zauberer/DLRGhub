<script setup lang="ts">
</script>

<template>
  
  <div class="container-xl">
    <div class="grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1 shift-table">

      <div class="shift" v-for="index in Array(10)">
        <div>
          <div class="shift__title">SA</div>
          <div class="shift__date">05.07.2025</div>
        </div>
        <div>
          <div class="shift__role">Wachleiter:</div>
          <div class="shift__name">Felix Hohenberger</div>
        </div>
        <div>
          <div class="shift__role">Wachgänger:</div>
          <div class="shift__name">André Sommer</div>
          <div class="shift__name">Cari Ruh</div>
        </div>
      </div>

    </div>
  </div>

</template>

<style scoped>

.shift-table {
  background: var(--theme-element-primary-color);
  gap: var(--theme-border-width);
  padding: var(--theme-border-width);
}

.shift {
  box-sizing: border-box;
  min-width: 150px;
  flex-grow: 1;
  background: var(--theme-background-color);
  padding: var(--theme-inner-element-spacing);
}

.shift >:not(:last-child) {
  margin-bottom: var(--theme-inner-element-spacing);
}

.shift .shift__title {
  font-weight: bold;
  font-size: 2em;
}

.shift .shift__role {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8em;
}

.shift .shift__name {
  font-style: italic;
  font-size: 0.8em;
}

</style>
