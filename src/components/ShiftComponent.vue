<template>

    <button ref="component" class="shift" @click="dialog = true" :selected="$route.query.shift === shift.id.id.toString() ? true : undefined">
        <div class="shift__descriptor">
            <div>
                <div class="shift__descriptor__day">{{ shift.date.toLocaleString([], { weekday: 'short' }).slice(0, 2).toUpperCase() }}</div>
                <div>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) }}</div>
            </div>
            <div v-if="shift.begin">
                <div>{{ shift.begin }}</div>
                <div v-if="shift.end">{{ shift.end }}</div>
            </div>
            <swd-icon class="shift__descriptor__marked star-filled-icon" v-if="data.profileName.value && shift.people.filter((person) => person.name === data.profileName.value).length"></swd-icon>
        </div>
        <div class="shift__content">
            <h5 v-if="shift.name">{{ shift?.name }}</h5>

            <div v-for="role of roles.filter(role => shift.people.filter(person => person.role === role).length !== 0)" :key="role">
                <div><strong>{{ role }}</strong></div>
                <ul><li v-for="person of shift.people.filter(person => person.role === role)" :key="person.name">{{ person.name }}</li></ul>
            </div>

            <div><ul><li v-for="person of shift.people.filter(person => !roles.includes(person.role))" :key="person.name">{{ person.name }}</li></ul></div>

        </div>
    </button>

    <DialogComponent :name="shift?.name || shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })" v-model="dialog" v-if="dialog">

            <div class="grid-cols-1" v-for="role of roles" :key="role">
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

.shift, .shift:active {
    display: flex;
    height: 100%;
    width: 100%;
    cursor: pointer;
    padding: initial;
    text-align: initial;
    background: initial !important;
    border: solid var(--theme-element-primary-color) var(--theme-border-width);
    border-radius: var(--theme-border-radius);
    --theme-element-spacing: var(--theme-inner-element-spacing);
}

.shift[selected]  {
    --theme-element-primary-color: var(--theme-primary-color);
    --theme-element-secondary-color: var(--theme-secondary-color);
}

.shift:hover {
    --theme-element-primary-color: var(--theme-element-secondary-color);
}


.shift .shift__descriptor {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    gap: var(--theme-element-spacing);
    height: 100%;
    font-size: 0.8em;
    background: var(--theme-element-primary-color);
    padding: calc(var(--theme-inner-element-spacing) - var(--theme-border-width));
}

.shift .shift__descriptor .shift__descriptor__day {
    font-size: 2em;
}

.shift__descriptor__marked {
    display: block;
    margin: auto auto 0 auto;
    color: var(--theme-accent-color);
    font-size: 2em;
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
import { inject, ref, useTemplateRef } from 'vue';
import DialogComponent from './DialogComponent.vue';
import ListInputComponent from './ListInputComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { useRoute } from 'vue-router';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const props = defineProps<{ shift: Shift, roles: string[] }>()

const component = useTemplateRef('component')
const dialog = ref<boolean>(false)

if (route.query.shift === props.shift.id.id.toString()) {
    component.value?.scrollIntoView({ behavior: 'smooth' })
}

</script>