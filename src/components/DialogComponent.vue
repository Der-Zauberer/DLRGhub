<template>

    <swd-dialog role="dialog" shown v-if="open">
        <swd-card>

            <div class="flex flex-space-between flex-center">
                <h4>{{ name }}</h4>
                <button class="ghost" @click="open = false"><swd-icon class="close-icon" aria-label="close"></swd-icon></button>
            </div>

            <slot></slot>

            <div class="grid-cols-2">
                <button class="grey-color" @click="open = false">Cancel</button>
                <button @click="open = false">{{ action }}</button>
            </div>

        </swd-card>
    </swd-dialog>

</template>

<script setup lang="ts">

const open = defineModel<boolean>()

defineProps<{ name: string, action: string }>()
defineEmits<{ ( e: 'success', value: void ): void }>()

</script>