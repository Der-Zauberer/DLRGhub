<template>

    <div class="container-xl">

        <HeadlineComponent :title="directory.value?.file?.name || 'Dateien'" :back="[ ...$route.params.pathMatch ].length ? { path: '/' + [ 'file', ...$route.params.pathMatch ].splice(0, [ ...$route.params.pathMatch ].length).join('/') } as unknown as RouteLocationAsRelativeGeneric : undefined">
            <template v-if="!directory.value?.file">
                <swd-dropdown>
                    <ButtonComponent color="ELEMENT" icon="add" aria-label="Erstellen" :disabled="!directory.value"/>
                    <swd-dropdown-content>
                        <swd-selection>
                            <ButtonComponent icon="folder" @click="createDialog.open = true; createDialog.type = 'directory'">Ordner</ButtonComponent>
                            <ButtonComponent icon="file" @click="createDialog.open = true; createDialog.type = 'text/plain'">Textdatei</ButtonComponent>
                            <ButtonComponent icon="file" @click="createDialog.open = true; createDialog.type = 'text/html'">HTML</ButtonComponent>
                        </swd-selection>
                    </swd-dropdown-content>
                </swd-dropdown>

                <ButtonComponent color="ELEMENT" icon="upload" aria-label="Hochladen" :disabled="!directory.value" @click="uploadFile(directory.value?.location)"/>
                <DialogComponent title="Neue Datei" action="Speichern" v-model="createDialog.open" :filter="createFile">
                    <InputComponent label="Name" v-model="createDialog.name" required/>
                </DialogComponent>
                <DialogComponent title="Umbenennen" action="Speichern" v-model="renameDialog.open" :filter="renameFile">
                    <InputComponent label="Name" v-model="renameDialog.name" required/>
                </DialogComponent>
            </template>
            <template v-if="directory.value?.file">
                <ButtonComponent v-if="!['image', 'video', 'audio'].includes(directory.value?.file.type.split('/')[0])" :color="Object.keys(route.query).includes('edit') ? 'PRMARY' : 'ELEMENT'" :disabled="saveFile.loading" :icon="saveFile.loading ? 'loading-spinner' : (Object.keys(route.query).includes('edit') ? 'save': 'pen')" :aria-label="Object.keys(route.query).includes('edit') ? 'save' : 'edit'" @click="Object.keys(route.query).includes('edit') ? saveFile.reload() : router.push({ name: route.name, params: route.params, query: { edit: null } })"/>
                <ButtonComponent color="ELEMENT" icon="download" aria-label="download" @click="downloadFile(directory.value?.file.path)"/>
            </template>
        </HeadlineComponent>

        <OfflineComponent :loading="directory.loading" @reload="directory.reload()"/>
        <swd-loading-spinner v-if="directory.loading || saveFile.loading || content.loading" :loading="directory.loading || saveFile.loading || content.loading" class="width-100"></swd-loading-spinner>
        <div class="red-text" v-if="directory.error || saveFile.error">{{ directory.error || saveFile.error }}</div>

        <div v-if="directory.value?.index" v-html="directory.value.index" class="margin-bottom"></div>

        <div v-if="directory.value?.directories && directory.value?.files" class="grid-cols-xl-6 grid-cols-lg-5 grid-cols-md-4 grid-cols-sm-3 grid-cols-2 directories">
            <RouterLink v-for="entry of directory.value?.directories.sort((a, b) => a.name.localeCompare(b.name))" :to="'/file' + entry.path">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path d="M1 3 H7 V7 H1 Z" style="fill: var(--theme-secondary-color); stroke: var(--theme-secondary-color); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <path d="M1 5 H 17 V13 H1 Z" style="fill: var(--theme-primary-color); stroke: var(--theme-primary-color); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                </svg>
                <div class="flex margin-bottom-0">
                    <div class="directory__name">{{ entry.name}}</div>
                    <swd-dropdown class="directory__options" @click="$event.preventDefault()">
                        <ButtonComponent icon="more" apperience="GHOST"></ButtonComponent>
                        <swd-dropdown-content>
                            <swd-selection>
                                <ButtonComponent icon="file" @click="renameDialog.open = true; renameDialog.id = entry.id">Umbenennen</ButtonComponent>
                                <ButtonComponent icon="delete" class="red-text" @click="openDeleteDialog(entry.id, entry.name)">Löschen</ButtonComponent>
                            </swd-selection>
                        </swd-dropdown-content>
                    </swd-dropdown>
                </div>
            </RouterLink>
            <RouterLink v-for="entry of directory.value?.files.sort((a, b) => a.name.localeCompare(b.name))" :to="'/file' + entry.path">
                <svg v-if="!entry.type.startsWith('image/')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                    <path d="M11 1H12 L15 4 V5 H11 Z" style="fill: #cccccc; stroke: #cccccc; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <path d="M3 1 H11 V5 H15 V17 H3 Z" style="fill: #e0e0e0; stroke: #e0e0e0; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"/>
                    <text x="3" y="16.5" style="font-size: 4px; font-weight: bold; fill: #00000080;">{{ entry.type.split('/')[1].toUpperCase() }}</text>
                </svg>
                <div v-if="entry.type.startsWith('image/')" class="directory__image">
                    <img :src="profileApiFilePath + entry.path">
                </div>
                <div class="flex margin-bottom-0">
                    <div class="directory__name">{{ entry.name }}</div>
                    <swd-dropdown class="directory__options" @click="$event.preventDefault()">
                        <ButtonComponent icon="more" apperience="GHOST"></ButtonComponent>
                        <swd-dropdown-content>
                            <swd-selection>
                                <ButtonComponent icon="download" @click="downloadFile(entry.path)">Herunterladen</ButtonComponent>
                                <ButtonComponent icon="pen" class="grey-color" :to="'/file' + entry.path  + '?edit'">Bearbeiten</ButtonComponent>
                                <ButtonComponent icon="file" @click="renameDialog.open = true; renameDialog.id = entry.id; renameDialog.name = entry.name">Umbenennen</ButtonComponent>
                                <ButtonComponent icon="delete" class="red-text" @click="openDeleteDialog(entry.id, entry.name)">Löschen</ButtonComponent>
                            </swd-selection>
                        </swd-dropdown-content>
                    </swd-dropdown>
                </div>
            </RouterLink>
        </div>

        <template v-if="directory.value?.file && !Object.keys(route.query).includes('edit')">
            <img v-if="directory.value.file.type.startsWith('image/')" :src="profileApiFilePath + directory.value.file.path" class="media-content">
            <video v-if="directory.value.file.type.startsWith('video/')" controls class="media-content">
                <source :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type">
            </video>
            <audio v-if="directory.value.file.type.startsWith('audio/')" controls class="media-content">
                <source :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type">
            </audio>
            <div v-if="directory.value.file.type === 'text/html'" v-html="content.value"></div>
            <div v-if="!['image', 'video', 'audio'].includes(directory.value.file.type.split('/')[0]) && directory.value.file.type !== 'application/pdf' && directory.value.file.type !== 'text/html'" class="text-content">{{ content.value }}</div>
        </template>

        <template v-if="directory.value?.file && Object.keys(route.query).includes('edit')">
            <swd-input>
                <textarea ref="editor" class="text-edit" v-model="content.value"></textarea>
            </swd-input>
        </template>

    </div>

    <embed v-if="directory?.value?.file?.type === 'application/pdf' && !Object.keys(route.query).includes('edit')" :src="profileApiFilePath + directory.value.file.path" :type="directory.value.file.type" class="pdf-content"/>

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
        text-decoration: unset !important;
        color: var(--theme-text-color);

        & .directory__image {
            display: block;
            box-sizing: border-box;
            aspect-ratio: 1/1;
            width: 100%;

            & img {
                width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: var(--theme-border-radius);
            }
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
            width: 100%;
        }

        & .directory__options {
            margin-right: calc((round(.6em,1px) - var(--theme-border-width)) / -1);
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
    height: calc(100vh - var(--theme-menu-height) - (4 * var(--theme-element-spacing)) - round(2.2em, 1px));
}

.text-content {
    min-height: 3em;
    white-space: pre-wrap;
}

.text-edit {
    height: auto;
    resize: none;
    overflow: hidden;
}

</style>

<script lang="ts" setup>
import ButtonComponent from '@/components/ButtonComponent.vue'
import DialogComponent from '@/components/DialogComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { resource } from '@/core/resource'
import type { BinaryFile, Directory } from '@/core/types'
import { DIALOG_SERVICE, DialogService } from '@/services/dialog.service'
import { SURREAL_DB_SERVICE, type SurrealDbService } from '@/services/surrealdb.service'
import { BoundQuery, surql, Table, RecordId } from 'surrealdb'
import { inject, reactive, useTemplateRef, nextTick, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationAsRelativeGeneric } from 'vue-router'

const route = useRoute()
const router = useRouter()
const dialogService = inject(DIALOG_SERVICE) as DialogService
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService
const profile = surrealdb.getProfile().default
const profileApiFilePath = `${profile.address.replace('ws', 'http')}/api/${profile.namespace}/${profile.database}/file`

const createDialog = reactive<{ open: boolean, name: string, type: 'directory' | 'text/plain' | 'text/html' }>({ open: false, name: '', type: 'directory' })
const renameDialog = reactive<{ open: boolean, id: RecordId<'directory'> | RecordId<'file'> | undefined, name: string }>({ open: false, id: undefined, name: '' })

const editor = useTemplateRef<HTMLTextAreaElement>('editor')

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
                    index: SELECT VALUE <string>content FROM ONLY file WHERE name = 'index.html' AND !parent
                }
            `
        } else {
            const path = '/' + [ ...parameter.route.params.pathMatch ]?.join('/')
            query = surql`
                {
                    location: SELECT VALUE id FROM ONLY directory WHERE path = ${path},
                    directories: SELECT VALUE <~directory.* FROM ONLY directory WHERE path = ${path},
                    files: SELECT VALUE <~file.* FROM ONLY directory WHERE path = ${path},
                    file: SELECT * OMIT content FROM ONLY file WHERE path = ${path},
                    index: SELECT VALUE <string>content FROM ONLY file WHERE name = 'index.html' AND path = ${path + '/index.html'}
                }
            `
        }
        return surrealdb.up().then(() => surrealdb.query<[{ location?: RecordId<'directory'>, directories: Directory[], files: BinaryFile[], file: BinaryFile | undefined, index?: string }]>(query).then(result => result[0]))
    }
})

const content = resource({
    parameter: { directory },
    loader: parameter => parameter.directory.value?.file && !['image', 'video', 'audio'].includes(parameter.directory.value.file.type.split('/')[0]) && parameter.directory.value.file.type !== 'application/pdf' ? fetch(profileApiFilePath + parameter.directory.value?.file.path).then(result => result.text()) : undefined
})

watch(content, async () => {
    await nextTick()
    if (!editor.value) return
    editor.value.style.height = 'auto'
    editor.value.style.height = editor.value.scrollHeight + 'px'
    
})

const saveFile = resource({
    loader: async () => {
        if (directory.value?.file) {
            await surrealdb.up()
            await surrealdb.update<BinaryFile>(directory.value.file.id).content({ 
                name: directory.value.file.name,
                type: directory.value.file.type,
                parent: directory.value.file.parent,
                content: encodeBinary(content.value!)
            })
            await directory.reload()
            router.push({ name: route.name, params: route.params })
        }
    }
})

function encodeBinary(content: string): ArrayBuffer {
    return new TextEncoder().encode(content).buffer
}

async function createFile(): Promise<boolean> {
    await surrealdb.up()
    if (!directory.value) {
        throw Error('Pfad konnte nicht geladen werden')
    }
    if (createDialog.type === 'directory') {
        await surrealdb.insert(new Table('directory'), { name: createDialog.name, parent: directory.value.location })
    } else {
        await surrealdb.insert(new Table('file'), { name: createDialog.name, type: createDialog.type, parent: directory.value.location, content: new ArrayBuffer() })
    }
    directory.reload()
    createDialog.name = ''
    return true
}

async function renameFile(): Promise<boolean> {
    await surrealdb.up()
    await surrealdb.update(renameDialog.id as RecordId).merge({ name: renameDialog.name })
    directory.reload()
    renameDialog.id = undefined
    renameDialog.name = ''
    return true
}

async function uploadFile(parent: RecordId<"directory"> | undefined) {
    const inputs = await loadFiles()
    for (const input of inputs) {
        await surrealdb.up()
        await surrealdb.insert(new Table('file'), { ...input, parent })
    }
    directory.reload()
}

async function downloadFile(path: string) {
    await surrealdb.up()
    const [file] = await surrealdb.query<[BinaryFile]>(surql`SELECT * FROM ONLY file WHERE path = ${path};`);
    const url = URL.createObjectURL(new Blob([file.content!], { type: file.type }))
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
}

function openDeleteDialog(id: RecordId<'directory'> | RecordId<'file'>, name: string) {
    dialogService.open = {
        title: 'Datei löschen',
        content: ['Bist du sicher die Datei zu löschen?', `<code>${name}</code>`],
        action: 'Löschen',
        filter: () => surrealdb.up().then(() => surrealdb.delete(id)).then(() => true),
        success: () => directory.reload()
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
            console.log()
            resolve(output)
        }
        input.onerror = error => reject(error) 
        input.click()
    })
}

</script>