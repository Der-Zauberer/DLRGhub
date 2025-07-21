<template>

    <div v-for="plan of plans.value">{{ plan.name }}</div>

</template>

<script setup lang="ts">
import { resource } from '@/core/resource';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { inject } from 'vue';

const data = inject(DATA_SERVICE) as DataService

const plans = resource({
    loader: () => data.getPlans()
})

</script>