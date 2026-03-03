<template>
    <component :is="link ? 'RouterLink' : 'div'" :to="{ name: 'weather' }" style="text-decoration: none;">
        <swd-card :class="'grid-span-md-2 grid-1 margin-bottom-0' + (link ? ' swd-card-hover' : '')">
            <HeadlineComponent title="Wetter" subtitle="Gailingen am Hochrhein" align="center"><swd-icon class="right-icon" v-if="link"></swd-icon></HeadlineComponent>

            <div class="flex flex-wrap flex-space-between">

                <div class="weather-preview">
                    <swd-icon class="weather-icon weather-preview__icon"></swd-icon>
                    <div v-if="weather.value">
                        <div class="weather-preview__text">{{ weather.value?.current.temperature_2m.toFixed(1) }}°</div>
                        <swd-subtitle>T: {{ Math.round(weather.value?.daily.temperature_2m_min[0] || 0) }}° H: {{ Math.round(weather.value?.daily.temperature_2m_max[0] || 0) }}°</swd-subtitle>
                    </div>
                    <div v-if="!weather.value">
                        <swd-skeleton-text class="weather-preview__text">&#160;&#160;&#160;&#160;&#160;&#160;</swd-skeleton-text>
                        <swd-subtitle><swd-skeleton-text>&#160;</swd-skeleton-text></swd-subtitle>
                    </div>
                </div>

                <div class="weather-preview">
                    <swd-icon class="water-icon weather-preview__icon"></swd-icon>
                    <div class="weather-preview__text" v-if="water.value">{{ water.value?.temperature[water.value?.temperature.length - 1 || 0].toFixed(1) }}°</div>
                    <swd-skeleton-text class="weather-preview__text" v-if="!water.value">&#160;&#160;&#160;&#160;&#160;&#160;</swd-skeleton-text>
                </div>

            </div>
        </swd-card>
    </component>
</template>

<style scoped>
.weather-preview {
	display: flex;
	gap: 0.6em;

	& .weather-preview__icon {
        aspect-ratio: 1;
		font-size: 2em;
        transform: translateY(20%);
	}

	& .weather-preview__text {
		font-size: 1.2em;
		align-self: center;
	}
}
</style>

<script setup lang="ts">
import HeadlineComponent from './HeadlineComponent.vue';
import type { Resource } from '@/core/resource';
import type { WaterTemperature, Weather } from '@/services/weather.service';

const props = defineProps<{ weather: Resource<Weather, unknown>, water: Resource<WaterTemperature, unknown>, link?: boolean }>()
</script>