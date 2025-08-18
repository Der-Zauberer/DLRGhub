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

    props.y.forEach((entry, index) => {
        context.beginPath()
        context.arc(calcX(index), calcY(entry), 4, 0, Math.PI*2)
        context.fillStyle = accentColor
        context.fill()
    })

    /*
    let last: { x: number, y:number } | undefined = undefined
    for (let i = 0; i < props.y.length; i++) {
        const point = { x: calcX(i), y: calcY(props.y[i]) }
        console.log(point)
        if (!last) {
            context.moveTo(point.x, point.y)
            last = point
            continue
        }
        const firstStep = { x: (point.x - last.x) / 2 + last.x, y: last.y }
        const secondStep = { x: ((point.x - last.x) / 2) * 1 + last.x, y: point.y }
        context.bezierCurveTo(firstStep.x, firstStep.y, secondStep.x, secondStep.y, point.x, point.y)
        //context.lineTo(point.x, point.y)
        last = point
    }
    context.strokeStyle = accentColor
    context.stroke()
    */

    props.y.forEach((entry, index) => {
        if (index === 0 ) {
            context.moveTo(calcX(index), calcY(entry))
        } else {
            const prevX = calcX(index - 1)
            const prevY = calcY(props.y[index - 1])
            const x = calcX(index)
            const y = calcY(entry)
            context.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2)
        }
        context.strokeStyle = accentColor
    })
    context.lineTo(calcX(props.y.length - 1), calcY(props.y[props.y.length - 1]))
    context.stroke()

})

</script>