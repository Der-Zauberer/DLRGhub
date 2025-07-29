<template>

    <button class="shift" @click="dialog = true">
        <div class="shift__descriptor">
            <div class="shift__descriptor__day">{{ shift.date.toLocaleString([], { weekday: 'short' }).slice(0, 2).toUpperCase() }}</div>     
            <div class="shift__descriptor__date">{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) }}</div>
            <div class="shift__descriptor__time" v-if="shift.begin"><span>{{ shift.begin }}</span><span v-if="shift.end">{{ shift.end }}</span></div>
        </div>
        <div class="shift__content">
            <h5 v-if="shift.name">{{ shift?.name }}</h5>

            <div v-for="role of roles.filter(role => shift.people.filter(person => person.role === role).length !== 0)">
                <div><strong>{{ role }}</strong></div>
                <ul><li v-for="person of shift.people.filter(person => person.role === role)">{{ person.name }}</li></ul>
            </div>

            <div><ul><li v-for="person of shift.people.filter(person => !roles.includes(person.role))">{{ person.name }}</li></ul></div>

        </div>
    </button>

    <DialogComponent :name="shift?.name || shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })" v-model="dialog" v-if="dialog">

            <div class="grid-cols-1" v-for="role of roles">
                <h6>{{ role }}</h6>
                <ListInputComponent
                    :list="shift.people.filter(person => person.role === role).map(person => person.name)"
                    @add="data.addShiftPerson(shift.id, { name: $event, role: role })"
                    @delete="data.removeShiftPerson(shift.id, { name: $event, role: role })"
                />
            </div>

            <div class="grid-cols-1">
                <h6>Sonstige</h6>
                <ListInputComponent 
                    :list="shift.people.filter(person => !roles.includes(person.role)).map(person => person.name)"
                    @add="data.addShiftPerson(shift.id, { name: $event })"
                    @delete="data.removeShiftPerson(shift.id, { name: $event })"
                />
            </div>
        </DialogComponent>

</template>

<style scoped>

.shift, .shift:hover {
    display: flex;
    height: 100%;
    width: 100%;
    cursor: pointer;
    background: initial;
    padding: initial;
    text-align: initial;
    border: solid var(--theme-element-primary-color) var(--theme-border-width);
    border-radius: var(--theme-border-radius);
    --theme-element-spacing: var(--theme-inner-element-spacing);
}

.shift .shift__descriptor {
    font-size: 0.8em;
    background: var(--theme-element-primary-color);
    padding: calc(var(--theme-inner-element-spacing) - var(--theme-border-width));
}

.shift .shift__descriptor .shift__descriptor__day {
    font-size: 2em;
}

.shift .shift__descriptor .shift__descriptor__time {
    display: flex;
    flex-direction: column;
    margin-top: var(--theme-element-spacing);
}

.shift .shift__content {
    display: flex;
    flex-direction: column;
    gap: var(--theme-element-spacing);
    font-size: 0.8em;
    padding: calc(var(--theme-element-spacing) - var(--theme-border-width));
}

.shift .shift__content h5 {
    margin: 0;
}

.shift .shift__content ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-style: italic;
}

</style>

<script setup lang="ts">
import type { Shift } from '@/core/types';
import { inject, ref } from 'vue';
import DialogComponent from './DialogComponent.vue';
import ListInputComponent from './ListInputComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';

const data = inject(DATA_SERVICE) as DataService

defineProps<{ shift: Shift, roles: string[] }>()

const dialog = ref<boolean>(false)

</script>