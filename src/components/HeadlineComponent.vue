<template>
    <div class="headline">
        <div class="headline__tools">
            <ButtonComponent v-if="back" :to="back" icon="left" aria-label="Zurück" color="ELEMENT"/>
            <h5>{{title}}<swd-subtitle v-if="subtitle">{{ subtitle }}</swd-subtitle></h5>
        </div>
        <div class="headline__tools">
            <div class="grey-text" v-if="resource?.status === 'LOADING'  && resource?.value"><swd-icon class="loading-spinner-icon"></swd-icon></div>
            <slot></slot>
        </div>
    </div>
    <swd-loading-spinner v-if="resource?.status === 'LOADING'  && !resource?.value" class="width-100" loading="true"></swd-loading-spinner>
    <div class="empty-state" v-if="resource?.status === 'EMPTY' || empty">Keine {{ (type || '') + ' ' }}gefunden!</div>
    <div class="error-state" v-if="resource?.status === 'ERROR'">{{ resource?.error }}</div>
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

.empty-state, .error-state {
    padding: calc(round(.5em,1px) - var(--theme-border-width)) calc(round(.6em,1px) - var(--theme-border-width));
    border-radius: var(--theme-border-radius);
    margin-bottom: var(--theme-element-spacing);
}

.empty-state {
    background: var(--theme-element-primary-color);
    text-align: center;
}

.error-state{
    background: var(--theme-error-color);
}

</style>

<script setup lang="ts">
import type { UnknownResource } from '@/core/resource';
import { type RouteLocationAsRelativeGeneric } from 'vue-router';
import ButtonComponent from './ButtonComponent.vue';

defineProps<{ title?: string, subtitle?: string, back?: RouteLocationAsRelativeGeneric, resource?: UnknownResource, empty?: boolean, type?: string}>()
</script>