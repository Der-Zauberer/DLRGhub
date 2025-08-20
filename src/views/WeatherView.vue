<template>

    <div class="container-xxl grid-cols-sm-2 grid-cols-1">

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wetter<swd-subtitle>Gailingen am Hochrhein</swd-subtitle></h4>
          <span v-if="weather.value">{{ `${weather.value.current.temperature_2m}°C` }}</span>
        </div>
        <PlotComponent v-if="weather.value" :x="weather.value.hourly.time" :y="weather.value.hourly.temperature_2m"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wassertemperatur<swd-subtitle>Neuhausen</swd-subtitle></h4>
          <span v-if="water.value">{{ `${water.value.temperature[water.value.temperature.length - 1].toFixed(1)}°C` }}</span>
        </div>
        <PlotComponent v-if="water.value" :x="water.value.time" :y="water.value.temperature"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wetter<swd-subtitle>Gailingen am Hochrhein</swd-subtitle></h4>
          <span v-if="weather.value">{{ `${weather.value.current.temperature_2m}°C` }}</span>
        </div>
        <PlotComponent2 v-if="weather.value" :x="weather.value.hourly.time" :y="weather.value.hourly.temperature_2m"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wassertemperatur<swd-subtitle>Neuhausen</swd-subtitle></h4>
          <span v-if="water.value">{{ `${water.value.temperature[water.value.temperature.length - 1].toFixed(1)}°C` }}</span>
        </div>
        <PlotComponent2 v-if="water.value" :x="water.value.time" :y="water.value.temperature"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wassertemperatur<swd-subtitle>Neuhausen</swd-subtitle></h4>
          23°C
        </div>
        <PlotComponent :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
      </swd-card>

      <swd-card>
        <div class="flex flex-space-between">
          <h4>Wassertemperatur<swd-subtitle>Neuhausen</swd-subtitle></h4>
          23°C
        </div>
        <PlotComponent2 :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
      </swd-card>

    </div>

</template>

<script setup lang="ts">
import PlotComponent from '@/components/PlotComponent.vue';
import PlotComponent2 from '@/components/PlotComponent2.vue';
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