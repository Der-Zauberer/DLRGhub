<template>

    <div v-if="!route.params.id" class="container-xl">

        <HeadlineComponent title="Dateien">
            <ButtonComponent color="ELEMENT" icon="add" aria-label="Erstellen" @click="createDialog = true"/>
            <ButtonComponent color="ELEMENT" icon="upload" aria-label="Hochladen" @click="uploadFile()"/>
            <DialogComponent name="Neue Datei" action="Speichern" v-model="createDialog" :filter="createFile">
                <form class="grid-cols-1">
                    <InputComponent label="Name" v-model="fileForm.name" required/>
                    <swd-dropdown>
                        <InputComponent label="Type" v-model="fileForm.type" required readonly/>
                        <swd-dropdown-content>
                            <swd-selection>
                                <a v-for="type of ['text/plain', 'text/html']">{{ type }}</a>
                            </swd-selection>
                        </swd-dropdown-content>
                    </swd-dropdown>
                </form>
            </DialogComponent>
        </HeadlineComponent>

        <swd-loading-spinner v-if="files.loading" :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div class="grid-cols-1">
            <template v-for="file in files.value">
                <ButtonLinkComponent :to="{ name: 'file', params: { id: file.id.id.toString() } }">{{ file.name }}</ButtonLinkComponent>
            </template>
        </div>

    </div>

    <div v-if="route.params.id" class="container-xl">
        <HeadlineComponent :back="{ name: 'files' }" :title="file.value?.name">
            <ButtonComponent v-if="file.value && !['image', 'video', 'audio'].includes(file.value.type.split('/')[0])" :color="editableContent ? 'PRMARY' : 'ELEMENT'" :disabled="saveFile.loading" :icon="saveFile.loading ? 'loading-spinner' : (editableContent ? 'done': 'pen')" :aria-label="editableContent ? 'save' : 'edit'" @click="editableContent ? saveFile.reload() : editableContent = true"/>
            <ButtonComponent v-if="file.value" color="ELEMENT" icon="download" aria-label="download" @click="downloadFile(file.value)"/>
            <ButtonComponent v-if="file.value" color="ELEMENT" icon="delete" aria-label="delete" @click="postDeleteDialog = true"/>
            <DialogComponent v-if="file.value" name="Datei löschen" action="Löschen" v-model="postDeleteDialog" @success="deleteFile(file.value.id)">
                <p>Bist du sicher die Datei zu löschen?</p>
                <code>{{ file.value.name }}</code>
            </DialogComponent>
        </HeadlineComponent>

        <swd-loading-spinner :loading="file.loading" class="width-100"></swd-loading-spinner>
        <div class="red-text" v-if="file.error || saveFile.error">{{ file.error || saveFile.error }}</div>

        <img v-if="file.value?.type.startsWith('image/')" :src="fileToDataUrl(file.value)" class="media-content">
        <video v-if="file.value?.type.startsWith('video/')" controls class="media-content">
            <source :src="fileToDataUrl(file.value)" :type="file.value.type">
        </video>
        <audio v-if="file.value?.type.startsWith('audio/')" controls class="media-content">
            <source :src="fileToDataUrl(file.value)" :type="file.value.type">
        </audio>
        
        <embed v-if="file.value?.type === 'application/pdf'" :src="fileToDataUrl(file.value)" :type="file.value?.type" class="pdf-content"/>
        <div v-if="file.value?.type === 'text/html'" v-html="decodeBinary(file.value.content)" :contenteditable="editableContent" @input="editContent = ($event.target as HTMLDivElement).innerHTML"></div>
        <div v-if="file.value && !['image', 'video', 'audio'].includes(file.value.type.split('/')[0]) && file.value?.type !== 'application/pdf' && file.value?.type !== 'text/html'" class="text-content" :contenteditable="editableContent" @input="editContent = ($event.target as HTMLDivElement).innerHTML">{{ decodeBinary(file.value.content) }}</div>
    </div>

</template>

<style scoped>

.media-content {
    display: block;
    max-width: 100%;
    margin: 0 auto;
}

.pdf-content {
    display: block;
    width: 100%;
    height: calc(100vh - var(--theme-menu-height) - (5 * var(--theme-element-spacing)) - round(2.5em, 1px));
}

.text-content {
    min-height: 3em;
    white-space: pre-wrap;
}

</style>

<script lang="ts" setup>
import ButtonComponent from '@/components/ButtonComponent.vue'
import ButtonLinkComponent from '@/components/ButtonLinkComponent.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { BinaryFile } from '@/core/types'
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service'
import { RecordId, surql, Table } from 'surrealdb'
import { inject, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const createDialog = ref<boolean>(false)
const postDeleteDialog = ref<boolean>(false)
const editableContent = ref<boolean>(false)

const fileForm: { name: string, type: string } = { name: '', type: '' }

const files = resource({
    parameter: { route },
    loader: () => !route.params.id ? surrealdb.query<[BinaryFile[]]>(surql`SELECT * OMIT content FROM file;`).then(result => result[0]) : undefined
})

const file = resource({
    parameter: { route },
    loader: () => {
        editableContent.value = false
        return route.params.id ? surrealdb.select<BinaryFile>(new RecordId('file', route.params.id)) : undefined
    }
})

const  editContent = ref<string | undefined>(undefined)
const saveFile = resource({
    loader: async () => {
        if (file.value && editContent.value !== undefined) {
            await file.reload(await surrealdb.update<BinaryFile>(file.value.id, { ...file.value, content: encodeBinary(editContent.value) }))
        }
        editableContent.value = false
    }
})

function encodeBinary(content: string): ArrayBuffer {
    return new TextEncoder().encode(content).buffer
}

function decodeBinary(bytes: ArrayBuffer): string {
    return new TextDecoder().decode(bytes)
}

async function createFile(): Promise<boolean> {
    await surrealdb.insert(new Table('file'), fileForm)
    files.reload()
    fileForm.name = ''
    fileForm.type = ''
    return true
}

async function uploadFile() {
    const input = await loadFiles()
    await surrealdb.insert(new Table('file'), input)
    files.reload()
}

async function downloadFile(file: BinaryFile) {
    const url = URL.createObjectURL(new Blob([new Uint8Array(file.content)], { type: file.type }))
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
}

async function deleteFile(id: RecordId) {
    await surrealdb.delete(id)
    router.push({ name: 'files' })
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
                    content: content.buffer as ArrayBuffer
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