<template>

    <div class="container-xl">

        <HeadlineComponent :title="post.value?.title" :resource="post" :back="{ name: 'home' }">
            <ButtonComponent v-if="post.value" icon="delete" @click="postDeleteDialog = true"><span class="only-bigger-sm">Löschen</span></ButtonComponent>
            <DialogComponent v-if="post.value" name="Dienstplan löschen" action="Löschen" v-model="postDeleteDialog" @success="deletePost(post.value.id)">
                    <p>Bist du sicher den Post zu löschen?</p>
                    <code>{{ post.value?.title }}</code>
            </DialogComponent>
            <swd-loading-spinner :loading="savePost.loading">
                <ButtonComponent v-if="post.value" icon="done" @click="savePost.reload()"><span class="only-bigger-sm">Speichern</span></ButtonComponent>
            </swd-loading-spinner>
        </HeadlineComponent>

        <form v-if="post.value" ref="form" class="grid-cols-1">

            <InputComponent label="Title" v-model="post.value.title" required/>
            <InputComponent label="Author" v-model="post.value.author" required/>

            <swd-input>
                <label for="message">Message</label>
                <textarea id="message" rows="15" style="height: initial;" v-model="post.value.message" required></textarea>
            </swd-input>

        </form>

    </div>

</template>

<script setup lang="ts">
import ButtonComponent from '@/components/ButtonComponent.vue';
import DialogComponent from '@/components/DialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import HeadlineComponent from '@/components/HeadlineComponent.vue';
import { resource } from '@/core/resource';
import type { Post } from '@/core/types';
import { SURREAL_DB_SERVICE, SurrealDbService } from '@/services/surrealdb.service'
import { RecordId } from 'surrealdb';
import { inject, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const surrealdb = inject(SURREAL_DB_SERVICE) as SurrealDbService

const formRef = useTemplateRef('form')

const postDeleteDialog = ref<boolean>(false)

const post = resource({
    loader: route.params.id !== 'new' ? surrealdb.select<Post>(new RecordId('post', route.params.id)) : {} as Post
})

const savePost = resource({
    loader: async () => {
        const form = formRef.value
        if (!form || !post.value) return
        if (!form.checkValidity()) {
            form.reportValidity()
            return
        }

        delete (post.value as any).created
        delete (post.value as any).updated

        post.value.id ? await surrealdb.update(post.value.id, post.value) : await surrealdb.insert('post', post.value)

        router.push({ name: 'home' })
    }
})

async function deletePost(id: RecordId) {
    await surrealdb.delete(id)
    router.push({ name: 'home' })
}

</script>