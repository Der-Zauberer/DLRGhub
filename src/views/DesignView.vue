<template>

    <div class="container-xl">

        <h2>Design Tokens</h2>

        <h2>Components</h2>

        <div class="components grid-cols-xl-3 grid-cols-lg-2 grid-cols-1">
            <div>
                <swd-card-outline>
                    
                    <swd-card class="width-100">
                        <h4>Title<swd-subtitle>Subtitle</swd-subtitle></h4>
                        <p>Lorem Ipsum dolar shit amet.</p>
                    </swd-card>

                </swd-card-outline>
                <swd-card>
                    Card
                </swd-card>
            </div>
            <div>
                <swd-card-outline>
                    
                    <dlrg-error class="width-100">Ein Fehler ist aufgetreten!</dlrg-error>

                </swd-card-outline>
                <swd-card>
                    Error Message
                </swd-card>
            </div>
            <div>
                <swd-card-outline>
                    
                    <dlrg-empty class="width-100">Keine Dienstpläne gefunden!</dlrg-empty> 

                </swd-card-outline>
                <swd-card>
                    Empty Message
                </swd-card>
            </div>
            <div>
                <swd-card-outline>

                    <ButtonComponent apperience="OUTLINE" color="ELEMENT">Send</ButtonComponent>
                    <ButtonComponent icon="done" color="ELEMENT"/>
                    <ButtonComponent icon="star" color="ACCENT">Like</ButtonComponent>
                    <ButtonComponent icon="close">Close</ButtonComponent>

                </swd-card-outline>
                <swd-card>
                    Buttons
                </swd-card>
            </div>
            <div>
                <swd-card-outline>
                    
                    <ButtonLinkComponent :to="{ name: 'home' }">Test</ButtonLinkComponent>

                </swd-card-outline>
                <swd-card>
                    Button Link
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                    
                    <AppointmentComponent :shift="{ id: new RecordId('shift', '01234'), date: new Date(), people: [], plan: { id: new RecordId('plan', '01234'), name: 'Wachplan 2025', roles: [] } }"/>
                    <AppointmentComponent :shift="{ id: new RecordId('shift', '01234'), date: new Date(), name: 'Beachbar', people: [], plan: { id: new RecordId('plan', '01234'), name: 'Beachbar', roles: [] } }"/>
                    <AppointmentComponent :shift="{ id: new RecordId('shift', '01234'), date: new Date(), name: 'Aufbau', begin: '13:00', end: '19:00', people: [], plan: { id: new RecordId('plan', '01234'), name: 'Beachbar', roles: [] } }"/>

                </swd-card-outline>
                <swd-card>
                    Shift Snippet (Button)
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                   
                    <ShiftComponent :shift="{ id: new RecordId('shift', '01234'), date: new Date(), name: 'Aufbau', begin: '13:00', end: '19:00', people: [ { name: 'Max Mustermann', role: 'Wachleiter' }, { name: 'Erika Musterfrau', role: 'Sanitäter' }, { name: 'Heinrich Huber', role: 'Default' }, { name: 'Simone Straub', role: 'Default' } ] }" :roles="['Wachleiter', 'Sanitäter', 'Wachgänger']"/>

                </swd-card-outline>
                <swd-card>
                    Shift
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                    
                    <InputComponent />
                    <InputComponent label="Label" />
                    <InputComponent placeholder="Placeholder"/>
                    <InputComponent placeholder="Placeholder" type="number" value="0"/>
                    <InputComponent value="Readonly" readonly/>
                    <InputComponent value="Disabled" disabled/>

                </swd-card-outline>
                <swd-card>
                    Input
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                   
                    <HeadlineComponent title="Title" subtitle="Subtitle" class="width-100">
                        <ButtonComponent icon="pen" color="ELEMENT">Edit</ButtonComponent>
                    </HeadlineComponent>

                </swd-card-outline>
                <swd-card>
                    Headline
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                   
                    TODO

                </swd-card-outline>
                <swd-card>
                    Action Bar
                </swd-card>
            </div>

            <div>
                <swd-card-outline>
                   
                    <swd-card class="width-100">
                        <PlotComponent color="var(--theme-primary-color)" title="Title" subtitle="Subtitle" :current="10" :x="[0, 1, 2, 3, 4]" :y="[2, 1, 3, 4, 5]"></PlotComponent>
                    </swd-card>

                </swd-card-outline>
                <swd-card>
                    Plot
                </swd-card>
            </div>
        </div>

    </div>

</template>

<style scoped>

.components > div {
    & > swd-card-outline {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        aspect-ratio: 1 / 1;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        margin-bottom: 0;
    }

    & > swd-card {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        margin-bottom: 0;
    }
}

</style>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import PlotComponent from '@/components/PlotComponent.vue';
import AppointmentComponent from '@/components/AppointmentComponent.vue';
import { RecordId } from 'surrealdb';
import ShiftComponent from '@/components/ShiftComponent.vue';
</script>