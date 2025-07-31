<template>
    
    <div class="container-xl">

        <HeadlineComponent :title="plan.value?.name" :status="plan.status" :back="{ name: 'plans' }">
            <button>Save</button>
        </HeadlineComponent>

        <div v-if="plan.value">

            <h6>Allgemein</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name" v-model="plan.value.name"/>
            </div>

            <h6>Rollen</h6>
            <div class="grid-cols-sm-2 grid-cols-1">
                <InputComponent />
                <button class="grey-color"><swd-icon class="add-icon"></swd-icon> Hinzufügen</button>
            </div>

            <h6>Schichten</h6>
            <div v-for="shift of plan.value.shifts" class="grid-cols-sm-2 grid-cols-1">
                <InputComponent label="Name (Optional)" v-model="shift.name"/>
                <InputComponent label="Datum" v-model="shift.date"/>
                <InputComponent label="Uhrzeit von (Optional)" v-model="shift.begin"/>
                <InputComponent label="Uhrzeit bis (Optional)" v-model="shift.end"/>
            </div>

        </div>

    </div>

</template>

<script setup lang="ts">
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { DATA_SERVICE, DataService } from '@/services/data.service'
import { RecordId } from 'surrealdb'
import { inject, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const data = inject(DATA_SERVICE) as DataService

const plan = data.getPlan(new RecordId('plan', route.params.id), new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

</script>