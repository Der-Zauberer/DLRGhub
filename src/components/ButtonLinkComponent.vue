<template>
    <RouterLink :to="to">
        <slot></slot>
        <div>
            <span>&nbsp;</span>
            <swd-icon class="arrow-right-icon"></swd-icon>
        </div>
    </RouterLink>
</template>

<style scoped>

a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    cursor: pointer;
    background: var(--theme-element-primary-color);
    color: var(--theme-text-color);
    user-select: none;
    -webkit-user-select: none;
    padding: calc(round(1em,1px) - var(--theme-border-width));
    border-radius: var(--theme-border-radius);

    &:hover, &:active, &:focus {
        background: var(--theme-element-secondary-color);
    }
}

</style>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{ to: RouteLocationRaw }>()

</script>