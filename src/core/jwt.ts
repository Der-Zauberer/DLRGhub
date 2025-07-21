export class JwtToken {
    header: {
        typ: string,
        alg: string
    }
    payload: {
        jit?: string,
        iss?: string,
        sub?: string,
        exp?: number,
        iat?: number,
        nbf?: number,
        [key: string]: unknown,
    }
    signature: string
    raw: string

    constructor(token: string) {
        const [header, payload, signature] = token.split('.')
        this.header = JSON.parse(atob(header))
        this.payload = JSON.parse(atob(payload))
        this.signature = signature
        this.raw = token
    }

    isExpired(): boolean {
        return !this.payload.exp || this.payload.exp * 1000 < new Date().getTime()
    }
}