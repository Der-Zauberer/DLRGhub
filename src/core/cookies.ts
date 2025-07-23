export class Cookies {
    
    private readonly cookies: Map<string, string> = new Map()

    constructor() {
        for (const cookie of document.cookie.split('; ')) {
            const [name, value] = cookie.split('=');
            this.cookies.set(name, decodeURIComponent(value || ''));
        }
    }

    get(name: string): string | undefined {
        return this.cookies.get(name)
    }

    getAll(): Map<string, string> {
        return new Map(this.cookies)
    }

    set(name: string, value: string, date?: Date) {
        if (!date) {
            date = new Date()
            date.setFullYear(date.getFullYear() + 1);
        }
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`
        this.cookies.set(name, value)
    }

    delete(name: string) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
        this.cookies.delete(name)
    }

}
