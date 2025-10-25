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
              <swd-subtitle>T: {{ Math.round(weather.value?.daily.temperature_2m_min[0] || 0) }}° H: {{ Math.round(weather.value?.daily.temperature_2m_max[0] || 0) }}°</swd-subtitle>
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
        <div class="weather-prediction-grid" v-if="weather.value">
          <div class="contents" v-for="prediction of getSevenDayPrediction(weather.value)">
            <div>{{ prediction.time }}:</div>
            <div>{{ prediction.rain + '%' }}</div>
            <div>
              <div class="weather-prediction-grid__bar" :style="`margin-left: ${prediction.minOffset}%; width: ${100 - prediction.minOffset - prediction.maxOffset}%;`">
                <span>{{ prediction.min }}°</span>
                <span>{{ prediction.max}}°</span>
              </div>
            </div>
          </div>
        </div>
      </swd-card>

      <swd-card>
        <PlotComponent v-if="weather.value" title="Wetter" subtitle="Gailingen am Hochrhein" color="var(--theme-accent-color)" :current="weather.value.current.temperature_2m" :x="weather.value.hourly.time" :y="weather.value.hourly.temperature_2m" :x-out="mapLocalDate" :y-out="(value) => value.toFixed(1) + '°'"/>
      </swd-card>

      <swd-card>
        <PlotComponent v-if="water.value" title="Wassertemperatur" subtitle="Neuhausen" color="var(--theme-accent-color)" :x="water.value.time" :y="water.value.temperature" :x-out="mapLocalDate" :y-out="(value) => value.toFixed(1) + '°'"/>
      </swd-card>

      <swd-card>
        <PlotComponent title="Testplot" subtitle="Testplot" color="var(--theme-accent-color)" :x="['1', '2', '3', '4', '5']" :y="[3, 3, 4, 5, 2]"/>
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

.weather-prediction-grid {
  display: grid;
  grid-template-columns: fit-content(0) fit-content(0) auto;
  box-sizing: border-box;
  white-space: nowrap;
  gap: round(0.6em, 1px) round(0.5em, 1px);
  align-items: center;
}

.weather-prediction-grid > .contents > div {
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.weather-prediction-grid .weather-prediction-grid__bar {
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  color: black;
  background-color: var(--theme-accent-color);
  border-radius: var(--theme-border-radius);
  padding: 0 round(0.3em, 1px);
}

.weather-prediction-grid .weather-grid__value {
  justify-self: end;
}

</style>

<script setup lang="ts">
import PlotComponent from '@/components/PlotComponent.vue';
import { resource } from '@/core/resource';
import { WEATHER_SERVICE, WeatherService, type Weather } from '@/services/weather.service';
import { inject } from 'vue';

const weatherService = inject(WEATHER_SERVICE) as WeatherService

const weather = resource({
  loader: () => weatherService.getWeather()
})

const water = resource({
  loader: () => weatherService.getWaterTemperature()
})

function mapLocalDate(date: string | number): string {
  const localDate = new Date(date.toString())
  return localDate.toLocaleString([], new Date().toDateString() === localDate.toDateString() ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getSevenDayPrediction(weather: Weather): { time: string, rain: number, min: number, max: number, minOffset: number, maxOffset: number }[] {
  const allMin = Math.min(...weather.daily.temperature_2m_min)
  const allMax = Math.max(...weather.daily.temperature_2m_max)
  const prediction : { time: string, rain: number, min: number, max: number, minOffset: number, maxOffset: number }[] = []
  for (const [index, time] of weather.daily.time.entries()) {
    const min = Math.round(weather.daily.temperature_2m_min[index])
    const max = Math.round(weather.daily.temperature_2m_max[index])
    prediction.push({
      time: new Date(time).toLocaleString([], { weekday: 'short' }).slice(0, 2),
      rain: Math.round(weather.daily.precipitation_probability_mean[index]),
      min,
      max,
      minOffset: (min - allMin) / allMax * 100,
      maxOffset: (allMax - max) / allMax * 100,
    })
  }
  return prediction
}

</script>