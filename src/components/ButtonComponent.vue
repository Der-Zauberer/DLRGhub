<template>
    <component :is="to ? 'RouterLink' : 'button'" :class="toClass(color, apperience, to)" :selected="selected !== false ? true : undefined" :aria-selected="selected ? true : undefined" :disabled="disabled ? true : undefined" @click="$emit('click', $event)" :to="to">
        <swd-icon v-if="icon" :class="`${icon}-icon`" aria-hidden="true"></swd-icon>
        <slot></slot>
    </component>
</template>

<style scoped>
a, button {
    display: flex;
    gap: 0.7ch;
}
</style>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

export type ButtonColor = 'PRMARY' | 'SECONDARY' | 'ACCENT' | 'ELEMENT'
export type ButtonApperience = 'DEFAULT' | 'OUTLINE' | 'GHOST'
defineProps<{ to?: RouteLocationRaw, icon?: string, color?: ButtonColor, apperience?: ButtonApperience, selected?: boolean, disabled?: boolean }>()
defineEmits<{ (e: 'click', event: MouseEvent): void }>()

function toClass(color?: ButtonColor, apperience?: ButtonApperience, to?: RouteLocationRaw): string {
    const classes = to ? ['button'] : []
    if (color) {
        classes.push(color === 'ELEMENT' ? 'grey-color' : `${color.toLowerCase()}-color`)
    }
    if (apperience && apperience !== 'DEFAULT') {
        classes.push(`${apperience.toLowerCase()}`)
    }
    return classes.join(' ')
}
</script>

