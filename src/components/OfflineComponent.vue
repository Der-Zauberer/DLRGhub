<template>
    <swd-card class="offline-card" v-if="surrealdb.status !== 'connected'">
        <div class="offline-card__content">
            <swd-icon class="offline-icon"></swd-icon>
            <div>
                <h3 class="margin-top-0">Offlinemodus</h3>
                <span>Du bist offline oder es konnte keine Verbindung zum Server hergestellt werden.</span>
            </div>
        </div>
        <ButtonComponent v-if="surrealdb.status === 'disconnected'" color="ELEMENT" :icon="loading ? 'loading-spinner' : 'reload'" @click="emits('reload')">Erneut versuchen</ButtonComponent>
    </swd-card>
</template>

<style lang="css" scoped>

.offline-card {
    display: flex;
    flex-wrap: wrap;
    gap: var(--theme-element-spacing);

    & .offline-card__content {
        display: flex;
        gap: var(--theme-element-spacing);

        swd-icon {
            aspect-ratio: 1;
            font-size: 2em;
        }
    }

    button {
        align-self: flex-end;
        margin-left: auto;
    }
}

</style>

<script setup lang="ts">
import { inject } from 'vue';
import ButtonComponent from './ButtonComponent.vue'
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service';
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

defineProps<{ loading: boolean }>()
const emits = defineEmits<{ ( e: 'reload', value: void ): unknown }>()
</script>