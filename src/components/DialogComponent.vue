<template>

    <swd-dialog role="dialog" shown v-if="open">
        <form ref="form" @submit="$event.preventDefault()" @keydown="$event.code === 'Escape' ? open = false : {}">
            <swd-card ref="slot">

                <div class="flex flex-space-between flex-center">
                    <h3>{{ title }}</h3>
                    <ButtonComponent v-if="!consent" icon="close" apperience="GHOST" @click="open = false" type="button"/>
                </div>

                <div class="grid-cols-1"><slot></slot></div>

                <p v-if="error" class="red-text">{{ error }}</p>

                <div :class="consent ? 'grid-cols-1' : 'grid-cols-2'" v-if="action">
                    <button type="button" v-if="!consent" class="grey-color" @click="open = false">Abbrechen</button>
                    <button type="submit" @click="success()">{{ action }}</button>
                </div>

            </swd-card>
        </form>
    </swd-dialog>

</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import ButtonComponent from './ButtonComponent.vue'

const slotRef = useTemplateRef('slot')
const open = defineModel<boolean>()
const error = ref<Error | undefined>()

const props = defineProps<{ title: string, consent?: boolean, action?: string, filter?: () => boolean | Promise<boolean> }>()
const emits = defineEmits<{ ( e: 'success', value: void ): Promise<void> }>()

const form = useTemplateRef<HTMLFormElement>('form')

async function success() {
    error.value = undefined
    if (slotRef.value) {
        if (form.value && !form.value.checkValidity()) {
            form.value.reportValidity()
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