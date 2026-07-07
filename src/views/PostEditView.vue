<template>

    <div class="container-xl">

        <HeadlineComponent :title="post.value?.title" :resource="post" :back="{ name: 'home' }">
            <ButtonComponent v-if="post.value" icon="delete" @click="openDeleteDialog(post.value)"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <swd-loading-spinner :loading="savePost.loading">
                <ButtonComponent v-if="post.value" icon="done" @click="savePost.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <OfflineComponent  :loading="post.loading" @reload="post.reload()"/>
        <dlrg-error v-if="(post?.status === 'ERROR' && parseCustomSurrealDbError(post.error).key !== 'error.connection') || savePost?.status === 'ERROR'">{{ post?.error || savePost?.error }}</dlrg-error>
        <swd-loading-spinner v-if="post?.status === 'LOADING' && !post?.value" class="width-100" loading="true"></swd-loading-spinner>

        <form v-if="post.value" ref="form" class="grid-cols-1">
            <InputComponent label="Title" v-model="post.value.title" required/>

            <swd-input>
                <label for="message">Message</label>
                <textarea id="message" rows="15" style="height: initial;" v-model="post.value.message" required></textarea>
            </swd-input>
        </form>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue'
import InputComponent from '@/components/InputComponent.vue'
import HeadlineComponent from '@/components/HeadlineComponent.vue'
import OfflineComponent from '@/components/OfflineComponent.vue'
import { resource } from '@/core/resource';
import type { Post } from '@/core/types';
import { parseCustomSurrealDbError, useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId, Table } from 'surrealdb'
import { useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDialogService } from '@/services/dialog.service'

const route = useRoute()
const router = useRouter()
const dialog = useDialogService()
const surreal = useSurrealDbService()

const formRef = useTemplateRef('form')

const post = resource({
    loader: route.params.id !== 'new' ? surreal.up().then(() => surreal.select<Post>(new RecordId('post', route.params.id))) : {} as Post
})

const savePost = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !post.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }

        delete (post.value as any).author
        delete (post.value as any).created
        delete (post.value as any).updated

        await surreal.up()
        post.value.id ? await surreal.update(post.value.id).content(post.value) : await surreal.insert(new Table('post'), post.value)

        router.push({ name: 'home' })
    }
})

function openDeleteDialog(post: Post) {
    dialog.open = {
        title: 'Dienstplan löschen',
        content: ['Bist du sicher den Post zu löschen?', `<code>${post.title}</code>`],
        action: 'Löschen',
        filter: () => surreal.delete(post.id).then(() => true),
        success: () => router.push({ name: 'home' })
    }
}

</script>