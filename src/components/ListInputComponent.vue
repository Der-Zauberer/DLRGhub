<template>
    <div v-if="list.length">
        <div v-for="entry of list" :key="entry">
            <span>{{ entry }}</span>
            <ButtonComponent class="list-button" apperience="GHOST" icon="delete" aria-label="Löschen" @click="$emit('delete', entry)"/>
        </div>
    </div>
    <div class="flex">
        <input class="list-input" ref="input" @keydown.enter="add($refs.input as HTMLInputElement)">
        <ButtonComponent color="ELEMENT" icon="add" aria-label="Hinzufügen" @click="add($refs.input as HTMLInputElement)"/>
    </div>
</template>

<style lang="css" scoped>

.list-button {
    font-size: 0.8em;
}

.list-input {
    width: 100%;
}

</style>

<script setup lang="ts">
import ButtonComponent from './ButtonComponent.vue';

defineProps<{ list: string[] }>()
const emits = defineEmits<{ (e: 'add', value: string): void, (e: 'delete', value: string): void }>()

function add(input: HTMLInputElement) {
    if (!input.value) return
    emits('add', input.value)
    input.value = ''
}

</script>