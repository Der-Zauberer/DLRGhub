<template>

    <swd-dialog role="dialog" shown v-if="open">
        <swd-card ref="slot">

            <div class="flex flex-space-between flex-center">
                <h4>{{ name }}</h4>
                <button class="ghost" @click="open = false"><swd-icon class="close-icon" aria-label="close"></swd-icon></button>
            </div>

            <slot></slot>

            <div class="grid-cols-2" v-if="action">
                <button class="grey-color" @click="open = false">Cancel</button>
                <button @click="success()">{{ action }}</button>
            </div>

        </swd-card>
    </swd-dialog>

</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

const slotRef = useTemplateRef('slot')
const open = defineModel<boolean>()

const props = defineProps<{ name: string, action?: string, filter?: () => boolean | Promise<boolean> }>()
const emits = defineEmits<{ ( e: 'success', value: void ): Promise<void> }>()

async function success() {
    if (slotRef.value) {
        const form = (slotRef.value as HTMLElement).querySelector('form') as HTMLFormElement | undefined
        if (form && !form.checkValidity()) {
            form.reportValidity()
            return
        }
    }
    const filter = await Promise.resolve(props.filter?.() || true)
    if (!filter) return
    open.value = false
    emits('success')
}
</script>