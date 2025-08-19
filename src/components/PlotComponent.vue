<template>
     <canvas ref="canvas" class="width-100"></canvas>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';

const props = defineProps<{ x: string[], y: number[] }>()
const canvasRef = useTemplateRef('canvas')

onMounted(async () => {

    const canvas = canvasRef.value
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const accentColor = getComputedStyle(canvas).getPropertyValue('--theme-accent-color').trim()
    const elementColor = getComputedStyle(canvas).getPropertyValue('--theme-element-primary-color').trim()

    const padding = 10
    const width = canvas.width - (padding * 2)
    const height = canvas.height - (padding * 2)
    
    const min = Math.min(...props.y)
    const max = Math.max(...props.y)
    const stepX = width / (props.x.length - 1)
    const stepY = height / (max - min)

    const calcX = (x: number) => stepX * x + padding
    const calcY = (y: number) => height + padding - (y - min) * stepY

    context.beginPath()
    context.moveTo(padding, padding)
    context.lineTo(padding, padding + height)
    context.lineTo(padding + width, padding + height)
    context.strokeStyle = elementColor
    context.stroke()

    context.fillStyle = elementColor
    const step = max - min > 5 ? Math.floor((max - min) / 5) : 1
    for (let i = Math.floor(min); i <= Math.floor(max); i += step)  context.fillText(i.toString(), 0, calcY(i))
    context.fillText(Math.floor(min).toString(), 0, calcY(Math.floor(min)))

    /*
    props.y.forEach((entry, index) => {
        context.beginPath()
        context.arc(calcX(index), calcY(entry), 4, 0, Math.PI*2)
        context.fillStyle = accentColor
        context.fill()
    })
    */

    context.beginPath()
    context.strokeStyle = accentColor
    props.y.forEach((entry, index) => {
        const [x, y] = [calcX(index), calcY(entry)]
        if (index === 0) {
            context.moveTo(x, y)
        } else {
            context.lineTo(x, y)
        }
    })
    context.lineTo(calcX(props.y.length - 1), calcY(props.y[props.y.length - 1]))
    context.stroke()

})

</script>