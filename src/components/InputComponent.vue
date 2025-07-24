<template>
    <swd-input>
        <label v-if="label" :for="toId(id)">{{ label }}</label>
        <input v-if="model || !value" :id="toId(id)" v-model="model" :type="type" :step="step" :readonly="readonly" :required="required" :disabled="disabled" :invalid="invalid ? invalid : undefined" @input="emit('input', $event as InputEvent)">
        <input v-if="!model && value" :value="value" :type="type" :step="step" :readonly="readonly" :required="required" :disabled="disabled" :invalid="invalid ? invalid : undefined" @input="emit('input', $event as InputEvent)">
    </swd-input>
</template>

<script setup lang="ts">
const props = defineProps<{ 
    id?: string,
    label?: string,
    value?: string,
    type?: string,
    step?: string
    readonly?: boolean
    required?: boolean,
    disabled?: boolean,
    invalid?: boolean
}>()

const emit = defineEmits<{ (e: 'input', event: InputEvent): void }>()

const model = defineModel()
const toId = (id?: string) => id ? id : 'input-' + props?.label?.toLocaleLowerCase()?.replace(/\s+/, '-')
</script>