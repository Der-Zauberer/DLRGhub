<template>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1000" style="width: 100%; aspect-ratio: 2/1;" ref="svg" @mousemove="inspectMouse($event)"  @touchstart="" @touchmove="inspectTouch($event)" @mouseleave="pointer = undefined" @touchend="pointer = undefined">
        <path d="M10 10 H1990 V990 H10 Z" stroke-width="10" stroke="#808080" fill="none"/>
        <path :d="`M${values.points[0].x} ${values.points[0].y} ${values.points.map(element => `L${element.x} ${element.y}`).join(' ')}`" stroke-width="10" stroke="yellow" fill="none"/>
        <path v-if="pointer" :d="`M${pointer.x} 10 V999`" stroke-width="10" stroke="white" fill="none"/>
        <circle v-if="pointer" r="20" :cx="pointer.x" :cy="pointer.y" stroke-width="2" stroke="white" fill="white"/>
    </svg>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
const props = defineProps<{ x: number[] | string[], y: number[] }>()
const svg = useTemplateRef('svg')

const pointer = ref<{ x: string, y: string, value: { x: number | string, y: number } } | undefined>(undefined)
const touchObjects = []

const values = computed(() => {
    const [height, width] = [1000, 2000]
    //const xValues = props.x.map(entry => typeof entry === 'number' ? entry : new Date(entry).valueOf())
    const [xMin, xMax] = /*[Math.min(...xValues), Math.max(...xValues)]*/ [0, props.x.length - 1]
    const [yMin, yMax] = [Math.min(...props.y), Math.max(...props.y)]
    const [stepX, stepY] = [width / (xMax - xMin), height / (yMax - yMin)]
    const points = []
    for (let i = 0; i < props.y.length; i++) points.push({ x: (i * stepX).toFixed(0), y: (height - (props.y[i] - yMin) * stepY).toFixed(0) })
    return { height, width, xMin, xMax, yMin, yMax, stepX, stepY, points }
})

function inspectMouse(event: MouseEvent) {
    const rect = svg.value?.getBoundingClientRect()
    if (!rect || !rect.left) return
    const x = Math.round((event.clientX - rect.left) * (values.value.width / rect.width) / values.value.stepX)
    pointer.value = { x: (x * values.value.stepX).toFixed(0), y: (values.value.height - (props.y[x] - values.value.yMin) * values.value.stepY).toFixed(0), value: { x: props.x[x], y: props.y[x] }}
}

function inspectTouch(event: TouchEvent) {
    const rect = svg.value?.getBoundingClientRect()
    if (!rect || !rect.left) return    
    const touchPosX = event.touches?.[0]?.clientX;
    if (!touchPosX) return
    const x = Math.round((touchPosX - rect.left) * (values.value.width / rect.width) / values.value.stepX)
    pointer.value = { x: (x * values.value.stepX).toFixed(0), y: (values.value.height - (props.y[x] - values.value.yMin) * values.value.stepY).toFixed(0), value: { x: props.x[x], y: props.y[x] }}
}

</script>