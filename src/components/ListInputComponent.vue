<template>
    <div>
        <div v-for="entry of list" :key="entry">
            <span>{{ entry }}</span>
            <ButtonComponent class="list-button" apperience="GHOST" icon="delete" aria-label="Löschen" @click="$emit('delete', entry)"/>
        </div>
    </div>
    <div class="flex">
        <input class="list-input" ref="input" @keydown.enter="($refs.input as HTMLInputElement).value ? $emit('add', ($refs.input as HTMLInputElement).value) : {}">
        <ButtonComponent color="ELEMENT" icon="add" aria-label="Hinzufügen" @click="($refs.input as HTMLInputElement).value ? $emit('add', ($refs.input as HTMLInputElement).value) : {}"/>
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
defineEmits<{ (e: 'add', value: string): void, (e: 'delete', value: string): void }>()

</script>