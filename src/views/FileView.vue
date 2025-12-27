<template>

    <div v-if="!route.params.id" class="container-xl">

        <HeadlineComponent title="Dateien">
            <ButtonComponent color="ELEMENT" icon="add" aria-label="Erstellen"></ButtonComponent>
            <ButtonComponent color="ELEMENT" icon="upload" aria-label="Hochladen" @click="upload()"></ButtonComponent>
        </HeadlineComponent>


        <swd-loading-spinner v-if="files.loading" :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div class="grid-cols-1">
            <template v-for="file in files.value" :key="file.id">
                <ButtonLinkComponent v-if="!file.type.startsWith('application/')" :to="{ name: 'file', params: { id: file.id.id.toString() } }">{{ file.name }}</ButtonLinkComponent>
                <ButtonLinkComponent v-if="file.type.startsWith('application/')" @click="open(file)">{{ file.name }}</ButtonLinkComponent>
            </template>
        </div>

    </div>

    <div v-if="route.params.id" class="container-xl">
        <HeadlineComponent :back="{ name: 'files' }" :title="file.value?.name"></HeadlineComponent>

        <swd-loading-spinner :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div class="red-text" v-if="file.error">{{ file.error }}</div>
        <div v-if="file.value && FILE_TYPES[file.value.type]">{{ FILE_TYPES[file.value.type].decode(file.value.content) }}</div>
        <embed v-if="file.value && !FILE_TYPES[file.value.type]" :src="fileToDataUrl(file.value)" :type="file.value?.type"/>
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
import ButtonComponent from '@/components/ButtonComponent.vue';
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import { resource } from '@/core/resource';
import type { BinaryFile } from '@/core/types';
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service';
import { RecordId, surql, Table } from 'surrealdb';
import { inject } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const FILE_TYPES: Record<string, {
    name: string
    encode: (content: string) => ArrayBuffer
    decode: (bytes: ArrayBuffer) => string
}> = {
    'text/plain': {
        name: 'Text',
        encode: (content: string) => new TextEncoder().encode(content),
        decode: (bytes) => new TextDecoder().decode(bytes)
    }
}

const fileForm : Partial<BinaryFile> & { id: RecordId<'file'> } = {
    id: new RecordId('file', ''),
    name: '',
    type: '',
    content: new ArrayBuffer()
}

const files = resource({
    parameter: { route },
    loader: () => !route.params.id ? surrealdb.query<[BinaryFile[]]>(surql`SELECT * OMIT content FROM file;`).then(result => result[0]) : undefined
})

const file = resource({
    parameter: { route },
    loader: () => route.params.id ? surrealdb.select<BinaryFile>(new RecordId('file', route.params.id)) : undefined
})

async function createOrEditFile() {
    await surrealdb.upsert(fileForm.id as RecordId, fileForm)
    files.reload()
}

async function upload() {
    const input = await loadFiles()
    console.log(input)
    await surrealdb.insert(new Table('file'), input)
    files.reload()
}

async function open(file: BinaryFile) {
    const url = fileToDataUrl(await surrealdb.select<BinaryFile>(file.id))
    window.open(url, '_blank', 'noopener,noreferrer')
}

async function loadFiles(): Promise<{ name: string, type: string, content: ArrayBuffer }[]> {
    return new Promise((resolve, reject) => {
        const output: { name: string, type: string, content: ArrayBuffer }[] = []
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async (event) => {
            const files = (event?.target as HTMLInputElement)?.files
            if (!files) return
            for (const file of files) {
                const reader = new FileReader()
                const content = await new Promise<Uint8Array>((resolve, reject) => {
                    reader.onload = (event) => resolve(new Uint8Array(event.target!.result as ArrayBuffer))
                    reader.onerror = (error) => reject(error)
                    reader.readAsArrayBuffer(file)
                })
                output.push({
                    name: file.name,
                    type: file.type,
                    content
                })
            }
            resolve(output)
        }
        input.onerror = error => reject(error) 
        input.click()
    })
}

function fileToDataUrl(file: BinaryFile) {
    let binary = '';
    const bytes = new Uint8Array(file.content);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return `data:${file.type};base64,${btoa(binary)}`
}

</script>