<template>
    <div>
        <div v-for="entry of list">
            <span>{{ entry }}</span>
            <button class="ghost list-button" @click="$emit('delete', entry)"><swd-icon class="delete-icon"></swd-icon></button>
        </div>
    </div>
    <div class="flex">
        <input class="list-input" ref="input" @keydown.enter="($refs.input as HTMLInputElement).value ? $emit('add', ($refs.input as HTMLInputElement).value) : {}">
        <button class="grey-color" @click="($refs.input as HTMLInputElement).value ? $emit('add', ($refs.input as HTMLInputElement).value) : {}"><swd-icon class="add-icon"></swd-icon></button>
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

defineProps<{ list: string[] }>()
defineEmits<{ (e: 'add', value: string): void, (e: 'delete', value: string): void }>()

</script>