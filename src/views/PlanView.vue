<template>

    <div class="container-xl">

        <div class="headline">
            <h4>Dienstpläne</h4>
            <button class="grey-color"><swd-icon class="add-icon"></swd-icon></button>
        </div>

        <ul class="button-grid grid-cols-md-2 grid-cols-1">
            <li v-for="plan of plans.value">
                <RouterLink :to="{ name: 'shifts', params: { id: plan.id.id.toString()} }">
                    <span>{{ plan.name }}</span>
                    <swd-icon class="arrow-right-icon"></swd-icon>
                </RouterLink>
            </li>
        </ul>

        <div class="headline">
            <h4>Meine Schichten <swd-subtitle>Keine ausgewählt</swd-subtitle></h4>
            <button class="grey-color"><swd-icon class="settings-icon"></swd-icon> <span></span></button>
        </div>

        <ul class="grid-cols-md-2 grid-cols-1">
            TODO
        </ul>

    </div>

</template>

<style scoped>

.headline {
    display: flex;
    justify-content: space-between;
    align-items: end;
}

.headline:not(:first-child) { margin-top: calc(var(--theme-element-spacing) * 2) }
.headline:not(:last-child) { margin-bottom: var(--theme-element-spacing) }
.headline * { margin: 0;}

.button-grid a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    text-decoration: none;
    padding: var(--theme-inner-element-spacing);
    color: var(--theme-text-color);
    background-color: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.button-grid a:hover, .button-grid a:focus, .button-grid a:active, .button-grid a[selected] { background-color: var(--theme-element-secondary-color) } 

</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { inject } from 'vue';

const data = inject(DATA_SERVICE) as DataService

const plans = resource({
    loader: () => data.getPlans()
})

</script>