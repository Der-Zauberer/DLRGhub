<template>

    <div class="container-xl">
        <div class="flex flex-center">
            <RouterLink :to="{ name: 'plans' }" class="button grey-color">
                <swd-icon class="left-icon" ></swd-icon>
            </RouterLink>
            <p>{{ plan.value?.plan.name }}</p>
        </div>

        <ul class="shifts grid-cols-xl-5 grid-cols-lg-4 grid-cols-md-3 grid-cols-sm-2 grid-cols-1">
            <li v-for="shift of plan.value?.shifts">
                <h5 class="margin-top-0">
                    {{ shift.name }}
                    <swd-subtitle>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</swd-subtitle>
                    <swd-subtitle v-if="shift.startTime && shift.endTime">{{ shift.startTime }} - {{ shift.endTime }}</swd-subtitle>
                </h5>

                <div v-for="role of plan.value?.plan.roles" class="margin-bottom">
                    <div><strong>{{ role }}</strong></div>
                    <div v-for="person of shift.people.filter(person => person.role === role)">
                        <i>{{ person.firstname }} {{ person.lastname }}</i>
                    </div>
                </div>
                <div v-for="person of shift.people.filter(person => !plan.value?.plan.roles.includes(person.role))">
                    <i>{{ person.firstname }} {{ person.lastname }}</i>
                </div>

            </li>
        </ul>

    </div>

</template>

<style scoped>

.shifts {
    gap: var(--theme-border-width);
    padding: var(--theme-border-width);
    background-color: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.shifts li {
    font-size: 0.8em;
    --theme-inner-element-spacing: 1em;
    --theme-element-spacing: 1em;
    padding: var(--theme-inner-element-spacing);
    background: var(--theme-background-color);
}

</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { RecordId } from 'surrealdb';
import { inject } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const plan = resource({
    loader: () => data.getPlan(new RecordId('plan', route.params.id))
})

</script>