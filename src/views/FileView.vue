<template>

    <div v-if="!route.params.id" class="container-xl">
        <swd-loading-spinner v-if="files.loading" :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div v-for="file in files.value"><RouterLink :to="{ name: 'file', params: { id: file.id.id.toString() } }">{{ file.name }}</RouterLink></div>
    </div>

    <div v-if="route.params.id" class="container-xl">
        <swd-loading-spinner :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div class="red-text" v-if="file.error">{{ file.error }}</div>
        <div v-if="file.value">{{ FILE_TYPES[file.value.type].decode(file.value.content) }}</div>
    </div>

    <div v-if="!route.params.id" class="container-xl">
        <form class="grid-cols-1" @submit.prevent="createOrEditFile()">
            <InputComponent label="Id" v-model="fileForm.id.id" required/>
            <InputComponent label="Name" v-model="fileForm.name" required/>
            <swd-dropdown>
                <InputComponent label="Type" v-model="fileForm.type" required readonly/>
                <swd-dropdown-content>
                    <swd-selection>
                        <a v-for="type of Object.keys(FILE_TYPES)">{{ type }}</a>
                    </swd-selection>
                </swd-dropdown-content>
            </swd-dropdown>
            <swd-input>
                <label for="content">Content</label>
                <textarea id="content" required :value="fileForm.content ? FILE_TYPES[fileForm.type || 'text/plain'].decode(fileForm.content) : ''" @input="fileForm.content = FILE_TYPES[fileForm.type || 'text/plain'].encode((($event.target) as HTMLInputElement).value)"></textarea>
            </swd-input>
            <input type="submit" value="Save">
        </form>
    </div>

</template>

<script lang="ts" setup>
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { ByteFile } from '@/core/types';
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { RecordId, surql } from 'surrealdb';
import { inject } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const FILE_TYPES: Record<string, {
    encode: (content: string) => Uint8Array
    decode: (bytes: Uint8Array) => string
}> = {
    'text/plain': {
        encode: (content: string) => new TextEncoder().encode(content),
        decode: (bytes) => new TextDecoder().decode(bytes)
    }
}

const fileForm : Partial<ByteFile> & { id: RecordId<'file'> } = {
    id: new RecordId('file', ''),
    name: '',
    type: '',
    content: new Uint8Array()
}

const files = resource({
    parameter: { route },
    loader: () => !route.params.id ? surrealdb.query<[ByteFile[]]>(surql`SELECT * OMIT content FROM file;`).then(result => result[0]) : undefined
})

const file = resource({
    parameter: { route },
    loader: () => route.params.id ? surrealdb.select<ByteFile>(new RecordId('file', route.params.id)) : undefined
})

async function createOrEditFile() {
    await surrealdb.upsert(fileForm.id as RecordId, fileForm)
    files.reload()
}

</script>