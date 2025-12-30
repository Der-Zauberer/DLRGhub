<template>
    <div class="flex flex-space-between">
        <h3>{{ title }}<swd-subtitle>{{ subtitle }}</swd-subtitle></h3>
        <span style="text-align: right;" v-if="y">
            {{ (yOut || (value => `${value}`))(pointer?.value.y || current || y[y.length - 1]) }}
            <swd-subtitle v-if="pointer">{{ (xOut || (value => `${value}`))(pointer.value.x) }}</swd-subtitle>
        </span>
    </div>
    <swd-skeleton-shape class="margin-bottom" style="width: 100%; aspect-ratio: 2/1;" v-if="!props.x || !props.y"></swd-skeleton-shape>
    <svg class="margin-bottom" style="width: 100%; aspect-ratio: 2/1;" v-if="props.x && props.y" xmlns="http://www.w3.org/2000/svg" :viewBox="`0 0 400 200`" ref="svg" @mousemove="inspectMouse($event)" @mouseleave="pointer = undefined" @touchmove="inspectTouch($event)" @touchend="pointer = undefined" @touchcancel="pointer = undefined">
        <path d="M1 1 H399 V199 H1 Z" stroke-width="2" stroke="#808080" fill="none"/>
        <template v-for="step of values.ySteps">
            <text x="5" :y="step.y - 5" font-size="14" fill="#808080">{{ step.label }}</text>
            <path :d="`M1 ${step.y} H400`" stroke-width="1" stroke="#808080" fill="none"/>
        </template>
        <path :d="`M${values.points[0].x} ${values.points[0].y} ${values.points.map(element => `L${element.x} ${element.y}`).join(' ')}`" stroke-width="2" :stroke="color || 'light-dark(black, white)'" fill="none" stroke-linecap="round" stroke-linejoin="round"/> 
        <path v-if="pointer" :d="`M${pointer.x} 1 V200`" stroke-width="2" stroke="white" fill="none"/>
        <circle v-if="pointer" r="4" :cx="pointer.x" :cy="pointer.y" stroke-width="0" stroke="white" fill="white"/>
    </svg>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

const props = defineProps<{ title: string, subtitle: string, color?: string, current?: number, x?: number[] | string[], y?: number[], xOut?: (x: number | string) => string, yOut?: (y: number) => string }>()
const svg = useTemplateRef('svg')

const pointer = ref<{ x: string, y: string, value: { x: number | string, y: number } } | undefined>(undefined)

const values = computed(() => {
    if (!props.x || !props.y) return { height: 0, width: 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0, stepX: 0, stepY: 0, points: [], ySteps: [] }
    const [height, width] = [200, 400]
    //const xValues = props.x.map(entry => typeof entry === 'number' ? entry : new Date(entry).valueOf())
    const [xMin, xMax] = /*[Math.min(...xValues), Math.max(...xValues)]*/ [0, props.x.length - 1]
    const [yMin, yMax] = [Math.min(...props.y), Math.max(...props.y)]
    const [stepX, stepY] = [width / (xMax - xMin), height / (yMax - yMin)]
    let lastX = undefined
    const points = []
    for (let i = 0; i < props.y.length; i++) {
        const point = { x: Math.floor(i * stepX), y: Math.floor(height - (props.y[i] - yMin) * stepY) }
        if (point.x !== lastX) {
            points.push(point)
            lastX = point.x
        }
    }
    const STEPS = [2, 2, 5, 1, 1, 1, 2, 2, 4, 4]
    const difference = yMax - yMin
    let exponent = yMin === 0 ? 0 : Math.floor(Math.log10(Math.abs(yMin)))
    const mostSignificantDigit = Math.round(difference / Math.pow(10, exponent))
    if (mostSignificantDigit <= 2) exponent--;
    const ySteps = []
    for (let i = Math.round(yMin / Math.pow(10, exponent) / STEPS[mostSignificantDigit]) / (1 / STEPS[mostSignificantDigit]); i < Math.round(yMax / Math.pow(10, exponent)); i += STEPS[mostSignificantDigit]) {
        const y = i * Math.pow(10, exponent)
        ySteps.push({ y: Math.floor(height - (y - yMin) * stepY), label: (props.yOut || (value => `${value}`))(y) })
    }
    return { height, width, xMin, xMax, yMin, yMax, stepX, stepY, points, ySteps }
})

function inspectMouse(event: MouseEvent) {
    if (!props.x || !props.y) return
    const rect = svg.value?.getBoundingClientRect()
    if (!rect || !rect.left) return
    const x = Math.round((event.clientX - rect.left) * (values.value.width / rect.width) / values.value.stepX)
    pointer.value = { x: (x * values.value.stepX).toFixed(0), y: (values.value.height - (props.y[x] - values.value.yMin) * values.value.stepY).toFixed(0), value: { x: props.x[x], y: props.y[x] }}
}

function inspectTouch(event: TouchEvent) {
    if (!props.x || !props.y) return
    const rect = svg.value?.getBoundingClientRect()
    if (!rect || !rect.left) return    
    const touchPosX = event.touches?.[0]?.clientX;
    if (!touchPosX) return

    event.preventDefault();
    const x = Math.round((touchPosX - rect.left) * (values.value.width / rect.width) / values.value.stepX)
    pointer.value = { x: (x * values.value.stepX).toFixed(0), y: (values.value.height - (props.y[x] - values.value.yMin) * values.value.stepY).toFixed(0), value: { x: props.x[x], y: props.y[x] }}
}

</script>