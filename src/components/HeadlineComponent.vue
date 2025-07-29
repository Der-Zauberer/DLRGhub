<template>
    <div class="headline">
        <div class="headline__tools" >
            <RouterLink class="button grey-color" v-if="back" :to="back"><swd-icon class="left-icon"></swd-icon></RouterLink>
            <h5>{{title}}<swd-subtitle v-if="subtitle">{{ subtitle }}</swd-subtitle></h5>
        </div>
        <div class="headline__tools">
            <div class="grey-text" v-if="status === 'LOADING'">Aktualisiere <swd-icon class="loading-spinner-icon"></swd-icon></div>
            <div class="grey-text" v-if="status === 'EMPTY'">Keine {{ (type || '') + ' ' }}gefunden!</div>
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>

.headline {
    display: flex;
    gap: var(--theme-inner-element-spacing);
    justify-content: space-between;
    align-items: end;
}

.headline h5 {
    font-weight: initial;
    margin: 0;
}

.headline, .headline .headline__tools {
    display: flex;
    gap: var(--theme-inner-element-spacing);
    align-items: center;
}

.headline:not(:first-child) { margin-top: calc(var(--theme-element-spacing) * 2) }
.headline:not(:last-child) { margin-bottom: var(--theme-element-spacing) }

</style>

<script setup lang="ts">
import type { ResourceStatus } from '@/core/resource';
import { RouterLink, type RouteLocationAsRelativeGeneric } from 'vue-router';


defineProps<{ title?: string, subtitle?: string, back?: RouteLocationAsRelativeGeneric, status?: ResourceStatus, type?: string}>()

</script>