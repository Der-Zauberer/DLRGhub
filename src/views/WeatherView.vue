<template>

    <div class="container-xxl grid-cols-sm-2 grid-cols-1">

      <swd-card>
        <h4>
          Wetter
          <swd-subtitle>Gailingen am Hochrhein</swd-subtitle>
        </h4>

        <div class="flex flex-wrap flex-space-between">

          <div class="weather-preview">
            <swd-icon class="weather-icon weather-preview__icon"></swd-icon>
            <div>
              <div class="weather-preview__text">{{ weather.value?.current.temperature_2m.toFixed(1) }}°</div>
              <swd-subtitle>T: {{ (weather.value?.daily.temperature_2m_min[0] || 0).toFixed(1) }}° H: {{ (weather.value?.daily.temperature_2m_max[0] || 0).toFixed(1) }}°</swd-subtitle>
            </div>
          </div>

          <div class="weather-preview">
            <swd-icon class="water-icon weather-preview__icon"></swd-icon>
            <div class="weather-preview__text">{{ water.value?.temperature[0].toFixed(1) }}°</div>
          </div>

        </div>

      </swd-card>

      <swd-card>
        <h4>
          7-Tage-Trend
          <swd-subtitle>Gailingen am Hochrhein</swd-subtitle>
        </h4>
        <div class="weather-grid">
          <div class="contents" v-for="(value, index) in weather.value?.daily.time">
            <div>{{ new Date(value).toLocaleString([], { weekday: 'short' }).slice(0, 2) }}:</div>
            <div>{{ (weather.value?.daily.precipitation_probability_mean[index] || 0) + '%' }}</div>
            <div class="weather-grid__value">{{ (weather.value?.daily.temperature_2m_min[index] || 0).toFixed(1) }}°</div>
            <div>-</div>
            <div class="weather-grid__value">{{ (weather.value?.daily.temperature_2m_max[index] || 0).toFixed(1)}}°</div>
          </div>
        </div>
      </swd-card>

      <swd-card>
        <PlotComponent v-if="weather.value" title="Wetter" subtitle="Gailingen am Hochrhein" :current="weather.value.current.temperature_2m" :x="weather.value.hourly.time.map(mapLocalDate)" :y="weather.value.hourly.temperature_2m"/>
      </swd-card>

      <swd-card>
        <PlotComponent v-if="water.value" title="Wassertemperatur" subtitle="Neuhausen" :x="water.value.time.map(mapLocalDate)" :y="water.value.temperature"/>
      </swd-card>

      <swd-card>
        <PlotComponent title="Testplot" subtitle="Testplot" :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
      </swd-card>

    </div>

</template>

<style>

.weather-preview {
  display: flex;
  gap: 0.6em;
}

.weather-preview .weather-preview__icon {
  font-size: 2.2em;
}

.weather-preview .weather-preview__text {
  font-size: 1.4em;
  align-self: center;
}

.weather-grid {
  display: grid;
  grid-template-columns: fit-content(0) fit-content(0) fit-content(0) fit-content(0) fit-content(0);
  box-sizing: border-box;
  white-space: nowrap;
  gap: 0 0.5em;
  align-items: center;
}

.weather-grid div {
  box-sizing: border-box;
  height: round(2.2em, 1px);
  padding: round(0.5em, 1px) 0;
}

.weather-grid .weather-grid__value {
  justify-self: end;
}

</style>

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

function mapLocalDate(date: string): string {
  return new Date(date).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

</script>