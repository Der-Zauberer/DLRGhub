<template>

    <div class="container-xl">

        <HeadlineComponent title="Dienstpläne" :resource="plans" type="Dienstpläne">
            <ButtonComponent icon="add" color="ELEMENT" :aria-label="plans.status!=='EMPTY' ? 'Neuen Dienstplan erstellen' : undefined" @click="planCreateDialog = true">{{ plans.status==='EMPTY' ? 'Neuen Dienstplan erstellen' : undefined }}</ButtonComponent>
            <DialogComponent name="Neuer Wachplan" action="Speichern" v-model="planCreateDialog" :filter="createPlan">
                <form class="grid-cols-1">
                    <InputComponent label="Name" v-model="createPlanForm.name" required/>
                </form>
            </DialogComponent>
        </HeadlineComponent>

        <ul class="button-grid grid-cols-md-2 grid-cols-1">
            <li v-for="plan of plans.value" :key="plan.id.id.toString()">
                <RouterLink :to="{ name: 'shifts', params: { id: plan.id.id.toString()} }">
                    <span>{{ plan.name }}</span>
                    <swd-icon class="arrow-right-icon" aria-hidden="true"></swd-icon>
                </RouterLink>
            </li>
        </ul>

        <HeadlineComponent title="Meine Schichten" :subtitle="profileName || 'Nicht konfiguriert'" :resource="shifts" type="Schichten">
            <ButtonComponent icon="settings" color="ELEMENT" :aria-label="profileName ? 'Konfigurieren' : undefined" :to="{ name: 'profile' }">{{ !profileName ? 'Konfigurieren' : undefined }}</ButtonComponent>
        </HeadlineComponent>

        <ul class="button-grid grid-cols-md-2 grid-cols-1">
            <li v-for="shift of shifts.value" :key="shift.id.id.toString()">
                <RouterLink :to="{ name: 'shifts', params: { id: shift.plan.id.id.toString()}, query: { shift: shift.id.id.toString() } }">
                    <div class="shift">
                        <div>
                            <div class="shift__day">{{ shift.date.toLocaleString([], { weekday: 'short' }).slice(0, 2).toUpperCase() }}</div>     
                            <div>{{ shift.date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) }}</div>
                        </div>
                        <div>
                            <div>{{ shift.name }}<swd-subtitle>{{ shift.plan.name }}</swd-subtitle></div>
                            <div></div>
                            <div>{{ shift.people.find(person => person.name === profileName)?.role }}</div>
                        </div>
                    </div>
                    <swd-icon class="arrow-right-icon" aria-hidden="true"></swd-icon>
                </RouterLink>
            </li>
        </ul>

    </div>

</template>

<style scoped>

.button-grid a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    padding: var(--theme-inner-element-spacing);
    color: var(--theme-text-color);
    background-color: var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.button-grid a:hover, .button-grid a:focus, .button-grid a:active, .button-grid a[selected] { background-color: var(--theme-element-secondary-color) } 

.shift {
    display: flex;
    gap: var(--theme-element-spacing)
}

.shift .shift__day {
    font-size: 2em;
    transform: translateY(5%);
}

</style>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import DialogComponent from '@/components/DialogComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue';
import { DATA_SERVICE, DataService } from '@/services/data.service';
import { inject, onBeforeUnmount, reactive, ref } from 'vue';

const data = inject(DATA_SERVICE) as DataService

const profileName = data.profileName
const planCreateDialog = ref<boolean>(false)

const createPlanForm = reactive<{ name?: string }>({})

const plans = data.getPlans(new Promise<void>(resolve => onBeforeUnmount(() => resolve())))
const shifts = data.getPersonShift(profileName.value, new Promise<void>(resolve => onBeforeUnmount(() => resolve())))

async function createPlan() {
    if (!createPlanForm.name) return false
    await data.createPlan(createPlanForm.name)
    return true
}

</script>