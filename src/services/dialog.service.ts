import { ref, type App, type Ref } from "vue"

export type DialogOptions = { title: string, content: string[], action?: string, filter?: () => boolean | Promise<boolean>, success?: () => unknown | Promise<unknown> }

export class DialogService {
    private dialog = ref<DialogOptions>()

    get open(): Ref<DialogOptions | undefined> {
        return this.dialog
    }

    set open(options: DialogOptions | undefined) {
        this.dialog.value = options
    }
}

export const DIALOG_SERVICE = 'dialogService'

export default {
    install(app: App) {
        const dialogService = new DialogService()
        app.config.globalProperties.$dialogService = dialogService
        app.provide(DIALOG_SERVICE, dialogService)
    }
}