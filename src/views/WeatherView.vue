<template>

	<div class="container-xxl grid-cols-md-2 grid-cols-1">

		<WeatherComponent :weather="weather" :water="water" class="grid-span-md-2 grid-span-1" />

		<swd-card>
			<h3>
				7-Tage-Trend
				<swd-subtitle>Gailingen am Hochrhein</swd-subtitle>
			</h3>
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
			<swd-subtitle class="grey-text" v-if="weather.value">
				<div>Quelle: <a :href="weather.value?.source.url" target="_blank">{{ weather.value?.source.name }}</a></div>
				<div>Zuletzt aktualisiert: {{ mapLocalDate(weather.value?.source.updated || 0) }}</div>
			</swd-subtitle>
			<swd-skeleton-shape class="weather-prediction-grid" v-if="!weather.value"></swd-skeleton-shape>
			<swd-subtitle class="width-100" v-if="!weather.value"><swd-skeleton-text></swd-skeleton-text><swd-skeleton-text></swd-skeleton-text></swd-subtitle>
		</swd-card>

		<swd-card>
			<PlotComponent title="Wassertemperatur" subtitle="Neuhausen Flurlingerbrücke" color="light-dark(var(--theme-primary-color), var(--theme-accent-color))" :x="water.value?.time" :y="water.value?.temperature" :x-out="mapLocalDate" :y-out="(value) => value.toFixed(1) + '°'"/>
			<swd-subtitle class="grey-text">
				<div>Quelle: <a :href="water.value?.source.url" target="_blank">{{ water.value?.source.name }}</a></div>
				<div>Zuletzt aktualisiert: {{ mapLocalDate(water.value?.source.updated || 0) }}</div>
			</swd-subtitle>
		</swd-card>

	</div>

</template>

<style scoped>

.weather-prediction-grid {
	display: grid;
	grid-template-columns: fit-content(0) fit-content(0) auto;
	box-sizing: border-box;
	gap: round(0.6em, 1px) round(0.5em, 1px);
	height: calc(7 * round(1.6em, 1px) + 6 * round(0.6em, 1px));
	white-space: nowrap;
	align-items: center;
	margin-bottom: var(--theme-element-spacing);

	& .weather-prediction-grid__bar {
		display: flex;
		justify-content: space-between;
		box-sizing: border-box;
		width: 100%;
		color: light-dark(white, black);
		background-color: light-dark(var(--theme-primary-color), var(--theme-accent-color));
		border-radius: var(--theme-border-radius);
		padding: 0 round(0.3em, 1px);
	}

	& .weather-grid__value {
		justify-self: end;
	}

	& > .contents > div {
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

}

</style>

<script setup lang="ts">
import PlotComponent from '@/components/PlotComponent.vue';
import WeatherComponent from '@/components/WeatherComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { type Weather } from '@/services/weather.service';
import { inject } from 'vue';

const dataService = inject(DATA_SERVICE) as DataService

const weather = dataService.getWeather()
const water = dataService.getWaterTemperature()

function mapLocalDate(date: string | number): string {
	const localDate = new Date(date.toString())
	return localDate.toLocaleString([], new Date().toDateString() === localDate.toDateString() ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getSevenDayPrediction(weather: Weather): { time: string, rain: number, min: number, max: number, minOffset: number, maxOffset: number }[] {
	const allMin = Math.round(Math.min(...weather.daily.temperature_2m_min))
	const allMax = Math.round(Math.max(...weather.daily.temperature_2m_max))
	const range = allMax - allMin
	const prediction : { time: string, rain: number, min: number, max: number, minOffset: number, maxOffset: number }[] = []
	for (const [index, time] of weather.daily.time.entries()) {
		const min = Math.round(weather.daily.temperature_2m_min[index])
		const max = Math.round(weather.daily.temperature_2m_max[index])
		prediction.push({
			time: new Date(time).toLocaleString([], { weekday: 'short' }).slice(0, 2),
			rain: Math.round(weather.daily.precipitation_probability_mean[index]),
			min,
			max,
			minOffset: (min - allMin) / range * 100,
			maxOffset: (allMax - max) / range * 100,
		})
	}
	return prediction
}

</script>