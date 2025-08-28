<template>
    <swd-input>
        <label v-if="label" :for="toId(id)">{{ label }}</label>
        <input :id="toId(id)" :value="model ?? value" :type="type" :placeholder="placeholder" :step="step" :readonly="readonly" :required="required" :disabled="disabled" :invalid="invalid ? invalid : undefined" @input="emit('input', $event as InputEvent); model = ($event.target as HTMLInputElement).value">
    </swd-input>
</template>

<script setup lang="ts">
const props = defineProps<{
    id?: string,
    label?: string
    value?: string
    type?: string
    placeholder?: string
    step?: string
    readonly?: boolean
    required?: boolean
    disabled?: boolean
    invalid?: boolean
}>()

const emit = defineEmits<{ (e: 'input', event: InputEvent): void }>()

const model = defineModel()
const toId = (id?: string) => id ? id : 'input-' + props?.label?.toLocaleLowerCase()?.replace(/\s+/, '-')
</script>