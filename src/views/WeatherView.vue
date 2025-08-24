<template>

    <div class="container-xxl grid-cols-sm-2 grid-cols-1">

      <swd-card>
        <PlotComponent v-if="weather.value" title="Wetter" subtitle="Gailingen am Hochrhein" :current="weather.value.current.temperature_2m" :x="weather.value.hourly.time" :y="weather.value.hourly.temperature_2m"/>
      </swd-card>

      <swd-card>
        <PlotComponent v-if="water.value" title="Wassertemperatur" subtitle="Neuhausen" :x="water.value.time" :y="water.value.temperature"/>
      </swd-card>

      <swd-card>
        <PlotComponent title="Testplot" subtitle="Testplot" :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
      </swd-card>

    </div>

</template>

<script setup lang="ts">
import PlotComponent from '@/components/PlotComponent.vue';
import { resource } from '@/core/resource';
import { WEATHER_SERVICE, WeatherService } from '@/services/weather.service';
import { inject } from 'vue';

const weatherService = inject(WEATHER_SERVICE) as WeatherService

const weather = resource({
  loader: () => weatherService.getWeather()
})

const water = resource({
  loader: () => weatherService.getWaterTemperature()
})

</script>