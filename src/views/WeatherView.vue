<template>

    <div class="container-xxl grid-cols-sm-2 grid-cols-1">

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wetter<swd-subtitle>Gailingen am Hochrhein</swd-subtitle></h4>
          23°C
        </div>
        <PlotComponent :x="['1', '2', '3', '4', '5']" :y="[2, 2, 3, 4, 1]"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wassertemperatur<swd-subtitle>Neuhausen</swd-subtitle></h4>
          23°C
        </div>
        <PlotComponent :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
      </swd-card>

    </div>

</template>

<script setup lang="ts">
import PlotComponent from '@/components/PlotComponent.vue';

</script>