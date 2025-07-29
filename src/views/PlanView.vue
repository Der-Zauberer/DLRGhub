<template>

    <div class="container-xl">

        <HeadlineComponent title="Dienstpläne" :status="plans.status" type="Dienstpläne">
            <button class="grey-color" @click="planCreateDialog = true">
                <swd-icon class="add-icon"></swd-icon>
                <span v-if="plans.status==='EMPTY'"> Neuen Dienstplan erstellen</span>
            </button>
            <DialogComponent name="Neuer Wachplan" action="Speichern" v-model="planCreateDialog" @success="createPlan()">
                <form class="grid-cols-1">
                    <InputComponent label="Name" v-model="createPlanForm.name"/>
                </form>
            </DialogComponent>
        </HeadlineComponent>

        <ul class="button-grid grid-cols-md-2 grid-cols-1">
            <li v-for="plan of plans.value">
                <RouterLink :to="{ name: 'shifts', params: { id: plan.id.id.toString()} }">
                    <span>{{ plan.name }}</span>
                    <swd-icon class="arrow-right-icon"></swd-icon>
                </RouterLink>
            </li>
        </ul>

        <ul class="button-grid grid-cols-md-2 grid-cols-1" v-if="plans.status === 'LOADING' && plans.empty">
            <li v-for="plan of Array(2)"><a><swd-skeleton-text></swd-skeleton-text></a></li>
        </ul>

        <swd-card class="red-color" v-if="plans.error">{{ plans.error }}</swd-card>

        <HeadlineComponent title="Meine Schichten" subtitle="Keine ausgewählt" status="EMPTY" type="Schichten">
            <button class="grey-color">
                <swd-icon class="settings-icon"></swd-icon>
                <span> Konfigurieren</span>
            </button>
        </HeadlineComponent>

        <ul class="grid-cols-md-2 grid-cols-1">
            TODO
        </ul>

    </div>

</template>

<style scoped>

.button-grid a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    text-decoration: none;
    padding: var(--theme-inner-element-spacing);
    color: var(--theme-text-color);
    background-color: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.button-grid a:hover, .button-grid a:focus, .button-grid a:active, .button-grid a[selected] { background-color: var(--theme-element-secondary-color) } 

</style>

<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { inject, onBeforeUnmount, reactive, ref } from 'vue';

const data = inject(DATA_SERVICE) as DataService

const planCreateDialog = ref<boolean>(false)

const createPlanForm = reactive<{ name?: string }>({})

const plans = data.getPlans(new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

function createPlan() {
    console.log('TODO')
}

</script>