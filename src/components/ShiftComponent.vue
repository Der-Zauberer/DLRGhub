<template>

    <button ref="component" class="shift" @click="dialog = true" :selected="$route.query.shift === shift.id.id.toString() ? true : undefined">
        <div class="shift__descriptor">
            <div>
                <b class="shift__descriptor__day">{{ shift.date.toLocaleString([], { weekday: 'short' }).slice(0, 2).toUpperCase() }}</b>
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

    <DialogComponent :name="shift?.name || shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })" v-model="dialog" v-if="dialog">
        <div v-for="[index, role] of [ ...roles, undefined ].entries()" :key="role" class="grid-cols-1 dialog-section">
            <h5>{{ role || 'Sonstige' }}</h5>

            <div class="person-entry" v-for="person of shift.people.filter(person => person.role === role).map(person => person.name)">
                <button disabled>{{ person }}</button>
                <ButtonComponent class="right-item" color="ELEMENT" icon="delete" aria-label="Löschen" @click="data.removeShiftPerson(shift.id, role ? { name: person, role: role } : { name: person })"/>
            </div>
            <div class="person-input">
                <input ref="input" @keydown.enter="proccessInput(($refs.input as HTMLInputElement[])[index], (input) => data.addShiftPerson(shift.id, role ? { name: input, role: role } : { name: input }))">
                <ButtonComponent color="ELEMENT" icon="add" aria-label="Hinzufügen" @click="proccessInput(($refs.input as HTMLInputElement[])[index], (input) => data.addShiftPerson(shift.id, role ? { name: input, role: role } : { name: input }))"/>
            </div>
        </div>
    </DialogComponent>

</template>

<style scoped>

.shift, .shift:active {
    display: flex;
    height: 100%;
    width: 100%;
    font-size: 16px;
    cursor: pointer;
    padding: initial;
    text-align: initial;
    background: initial !important;
    color: var(--theme-text-color);
    border: solid var(--theme-element-primary-color) var(--theme-border-width);
    border-radius: var(--theme-border-radius);
    --theme-element-spacing: var(--theme-inner-element-spacing);

    &[selected]  {
        --theme-element-primary-color: var(--theme-primary-color);
        --theme-element-secondary-color: var(--theme-secondary-color);
    }

    &:hover {
        --theme-element-primary-color: var(--theme-element-secondary-color);
    }

    & .shift__descriptor {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        gap: var(--theme-element-spacing);
        height: 100%;
        text-align: center;
        background: var(--theme-element-primary-color);
        padding: calc(var(--theme-inner-element-spacing) - var(--theme-border-width));

        & .shift__descriptor__day {
            font-size: 1.5em;
        }

        & .shift__descriptor__marked {
            display: block;
            margin: auto auto 0 auto;
            color: light-dark(var(--theme-primary-color), var(--theme-accent-color)) !important;
            font-size: 2em;
        }
    }

    & .shift__content {
        display: flex;
        flex-direction: column;
        gap: var(--theme-element-spacing);
        padding: calc(var(--theme-element-spacing) - var(--theme-border-width));

        & h5 {
            margin: 0;
        }

        & ul {
            list-style: none;
            padding: 0;
            margin: 0;
            font-style: italic;
        }
    }
}

.dialog-section {
    margin-top: calc(2 * var(--theme-element-spacing));

    & .person-entry {
        display: flex;

        & button:first-child {
            --theme-primary-color: var(--theme-element-primary-color);
            --theme-secondary-color: var(--theme-element-primary-color);
            cursor: pointer;
            color: white !important;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }

        & button:last-child {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    }

    & .person-input {
        display: flex;

        & input {
            width: 100%;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }

        & button {
            --theme-primary-color: var(--theme-element-secondary-color);
            --theme-secondary-color: inherit;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        &:has(input:focus) button {
            --theme-primary-color: inherit;
        }
    }
}

</style>

<script setup lang="ts">
import type { Shift } from '@/core/types';
import { inject, ref, useTemplateRef } from 'vue';
import DialogComponent from './DialogComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { useRoute } from 'vue-router';
import ButtonComponent from './ButtonComponent.vue';

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const props = defineProps<{ shift: Shift, roles: string[] }>()

const component = useTemplateRef('component')
const dialog = ref<boolean>(false)

if (route.query.shift === props.shift.id.id.toString()) {
    component.value?.scrollIntoView({ behavior: 'smooth' })
}

function proccessInput(input: HTMLInputElement, callback: (input: string) => unknown) {
    if (!input.value) return
    callback(input.value)
    input.value = ''
}

</script>