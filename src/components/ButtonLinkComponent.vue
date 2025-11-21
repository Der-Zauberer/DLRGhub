<template>
    <RouterLink :to="to" class="button grey-color dark-text">
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
    padding: calc(round(1em,1px) - var(--theme-border-width));
}

</style>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{ to: RouteLocationRaw }>()

</script>