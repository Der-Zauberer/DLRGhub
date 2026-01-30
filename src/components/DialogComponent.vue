<template>

    <swd-dialog role="dialog" shown v-if="open">
        <swd-card ref="slot">

            <div class="flex flex-space-between flex-center">
                <h3>{{ title }}</h3>
                <ButtonComponent icon="close" apperience="GHOST" @click="open = false"/>
            </div>

            <slot></slot>

            <p v-if="error" class="red-text">{{ error }}</p>

            <div class="grid-cols-2" v-if="action">
                <button class="grey-color" @click="open = false">Abbrechen</button>
                <button @click="success()">{{ action }}</button>
            </div>

        </swd-card>
    </swd-dialog>

</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import ButtonComponent from './ButtonComponent.vue'

const slotRef = useTemplateRef('slot')
const open = defineModel<boolean>()
const error = ref<Error | undefined>()

const props = defineProps<{ title: string, action?: string, filter?: () => boolean | Promise<boolean> }>()
const emits = defineEmits<{ ( e: 'success', value: void ): Promise<void> }>()

async function success() {
    error.value = undefined
    if (slotRef.value) {
        const form = (slotRef.value as HTMLElement).querySelector('form') as HTMLFormElement | undefined
        if (form && !form.checkValidity()) {
            form.reportValidity()
            return
        }
    }
    try {
        const filter = await Promise.resolve(props.filter?.() || true)
        if (!filter) return
        open.value = false
        emits('success')
    } catch(err) {
        error.value = err as Error
    }
    
}
</script>