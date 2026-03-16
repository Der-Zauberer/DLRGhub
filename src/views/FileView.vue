<template>

    <div class="container-xl">

        <HeadlineComponent :title="directory.value?.file?.name || 'Dateien'">
            <template v-if="!directory.value?.file">
                <ButtonComponent color="ELEMENT" icon="add" aria-label="Erstellen" @click="createDialog = true"/>
                <ButtonComponent color="ELEMENT" icon="upload" aria-label="Hochladen" @click="uploadFile()"/>
                <DialogComponent title="Neue Datei" action="Speichern" v-model="createDialog" :filter="createFile">
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
            </template>
            <template v-if="directory.value?.file">
                <ButtonComponent v-if="!['image', 'video', 'audio'].includes(directory.value?.file.type.split('/')[0])" :color="editableContent ? 'PRMARY' : 'ELEMENT'" :disabled="saveFile.loading" :icon="saveFile.loading ? 'loading-spinner' : (editableContent ? 'done': 'pen')" :aria-label="editableContent ? 'save' : 'edit'" @click="editableContent ? saveFile.reload() : editableContent = true"/>
                <ButtonComponent color="ELEMENT" icon="download" aria-label="download" @click="downloadFile(directory.value?.file)"/>
                <ButtonComponent color="ELEMENT" icon="delete" aria-label="delete" @click="openDeleteDialog(directory.value?.file)"/>
            </template>
        </HeadlineComponent>

        <swd-loading-spinner v-if="directory.loading || saveFile.loading || content.loading" :loading="directory.loading || saveFile.loading || content.loading" class="width-100"></swd-loading-spinner>
        <div class="red-text" v-if="directory.error || saveFile.error">{{ directory.error || saveFile.error }}</div>

        <div v-if="directory.value?.directories && directory.value?.files" class="grid-cols-xl-6 grid-cols-lg-5 grid-cols-md-4 grid-cols-sm-3 grid-cols-2 directories">
            <RouterLink v-for="entry of directory.value?.directories" :to="'/file' + entry.path">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path d="M1 3 H7 V7 H1 Z" style="fill: var(--theme-secondary-color); stroke: var(--theme-secondary-color); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <path d="M1 5 H 17 V13 H1 Z" style="fill: var(--theme-primary-color); stroke: var(--theme-primary-color); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                </svg>
                <span class="directory__name">{{ entry.name }}</span>
            </RouterLink>
            <RouterLink v-for="entry of directory.value?.files" :to="'/file' + entry.path">
                <svg v-if="!entry.type.startsWith('image/')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path d="M11 1H12 L15 4 V5 H11 Z" style="fill: #cccccc; stroke: #cccccc; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <path d="M3 1 H11 V5 H15 V17 H3 Z" style="fill: #e0e0e0; stroke: #e0e0e0; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <text x="3" y="16.5" style="font-size: 4px; font-weight: bold; fill: #00000080;">{{ entry.type.split('/')[1].toUpperCase() }}</text>
                </svg>
                <svg v-if="entry.type.startsWith('image/')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"></svg>
                <img v-if="entry.type.startsWith('image/')" :src="profileApiFilePath + entry.path">
                <span class="directory__name">{{ entry.name}}</span>
            </RouterLink>
        </div>

        <template v-if="directory.value?.file">
            <img v-if="directory.value.file.type.startsWith('image/')" :src="profileApiFilePath + directory.value.file.path" class="media-content">
            <video v-if="directory.value.file.type.startsWith('video/')" controls class="media-content">
                <source :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type">
            </video>
            <audio v-if="directory.value.file.type.startsWith('audio/')" controls class="media-content">
                <source :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type">
            </audio>
            
            <embed v-if="directory.value.file.type === 'application/pdf'" :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type" class="pdf-content"/>
            <div v-if="directory.value.file.type === 'text/html'" v-html="content.value" :contenteditable="editableContent" @input="editContent = ($event.target as HTMLDivElement).innerHTML"></div>
            <div v-if="!['image', 'video', 'audio'].includes(directory.value.file.type.split('/')[0]) && directory.value.file.type !== 'application/pdf' && directory.value.file.type !== 'text/html'" class="text-content" :contenteditable="editableContent" @input="editContent = ($event.target as HTMLDivElement).innerHTML">{{ content.value }}</div>
        </template>

    </div>

</template>

<style scoped>

.directories {
    --theme-element-spacing: 15px;
    margin: 0 calc(var(--theme-element-spacing) / -1);
    gap: 0;

    & > * {
        position: relative;
        padding: calc(var(--theme-element-spacing));
        border-radius: var(--theme-border-radius);
        text-align: center;

        & img {
            position: absolute;
            box-sizing: border-box;
            top: 0;
            left: 0;
            width: calc(100% - var(--theme-element-spacing) * 2);
            margin: calc(var(--theme-element-spacing));
            border-radius: var(--theme-border-radius);
        }

        & .directory__name {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-clamp: 2;
            overflow-wrap: anywhere;
            overflow: hidden;
            text-overflow: elipsis;
            font-size: 0.8em;
            height: round(2.2em, 1px);
            color: var(--theme-text-color);
            
        }

    }

    & > *:hover {
        background: var(--theme-element-primary-color);
    }

}

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
import DialogComponent from '@/components/DialogComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import { resource } from '@/core/resource'
import type { BinaryFile, Directory } from '@/core/types'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service'
import { BoundQuery, surql, Table } from 'surrealdb'
import { inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const dialogService = inject(DIALOG_SERVICE) as DialogService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profile = surrealdb.getProfile().default
const profileApiFilePath = `${profile.address.replace('ws', 'http')}/api/${profile.namespace}/${profile.database}/file`

const createDialog = ref<boolean>(false)
const editableContent = ref<boolean>(false)

const fileForm: { name: string, type: string } = { name: '', type: '' }

const directory = resource({
    parameter: { route },
    loader: parameter => {
        let query: BoundQuery
        if (!parameter.route.params.pathMatch) {
            query = surql`
                {
                    directories: SELECT * FROM directory WHERE !parent,
                    files: SELECT * OMIT content FROM file WHERE !parent,
                    file: NONE,
                }
            `
        } else {
            const path = '/' + [ ...parameter.route.params.pathMatch ]?.join('/')
            query = surql`
                {
                    directories: SELECT VALUE <~directory.* FROM ONLY directory WHERE path = ${path},
                    files: SELECT VALUE <~file.* FROM ONLY directory WHERE path = ${path},
                    file:  SELECT * OMIT content FROM ONLY file WHERE path = ${path},
                }
            `
        }
        return surrealdb.up().then(() => surrealdb.query<[{ directories: Directory[], files: BinaryFile[], file: BinaryFile | undefined}]>(query).then(result => result[0]))
    }
})

const content = resource({
    parameter: { directory },
    loader: parameter => parameter.directory.value?.file && !['image', 'video', 'audio'].includes(parameter.directory.value.file.type.split('/')[0]) && parameter.directory.value.file.type !== 'application/pdf' ? fetch(profileApiFilePath + parameter.directory.value?.file.path).then(result => result.text()) : undefined
})

const editContent = ref<string | undefined>(undefined)
const saveFile = resource({
    loader: async () => {
        if (directory.value?.file && editContent.value !== undefined) {
            await surrealdb.up()
            await surrealdb.update<BinaryFile>(directory.value.file.id).content({ 
                name: directory.value.file.name,
                type: directory.value.file.type,
                parent: directory.value.file.parent,
                content: encodeBinary(editContent.value) 
            })
            await directory.reload()
        }
        editableContent.value = false
    }
})

function encodeBinary(content: string): ArrayBuffer {
    return new TextEncoder().encode(content).buffer
}

async function createFile(): Promise<boolean> {
    await surrealdb.up()
    await surrealdb.insert(new Table('file'), fileForm)
    directory.reload()
    fileForm.name = ''
    fileForm.type = ''
    return true
}

async function uploadFile() {
    const input = await loadFiles()
    await surrealdb.up()
    await surrealdb.insert(new Table('file'), input)
    directory.reload()
}

async function downloadFile(file: BinaryFile) {
    if (!content.value) return
    const url = URL.createObjectURL(new Blob([content.value], { type: file.type }))
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
}

function openDeleteDialog(file: BinaryFile) {
    dialogService.open = {
        title: 'Datei löschen',
        content: ['Bist du sicher die Datei zu löschen?', `<code>${file.name}</code>`],
        action: 'Löschen',
        filter: () => surrealdb.up().then(() => surrealdb.delete(file.id)).then(() => true),
        success: () => router.push({ name: 'files' })
    }
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

</script>