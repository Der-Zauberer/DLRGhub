import { isReactive, isRef, reactive, toRaw, watch, type Reactive, type Ref } from "vue";

export type ResourceValue<T, P> = ((parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined) | Promise<T | undefined> | T | undefined
export type ResourceParameter<P> = Reactive<P> | { [K in keyof P]: Ref<P[K]> | Reactive<P[K]> }

export type UnknownResource = {
    readonly error?: Error
    readonly loading: boolean
    readonly empty: boolean
    readonly status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    readonly value?: unknown
}

export type Resource<T, P> = {
    readonly error?: Error
    readonly loading: boolean
    readonly empty: boolean
    readonly status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    readonly value?: T
    reload: (value?: ResourceValue<T, P>) => Promise<T | undefined> | T | undefined
}

type MutableResource<T, P> = {
    error?: Error
    loading: boolean
    empty: boolean
    status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    value?: T
    reload: (value?: ResourceValue<T, P>) => Promise<T | undefined> | T | undefined
}

export type ResourceOptions<T, P> = {
    parameter?: ResourceParameter<P>
    initializer?: ResourceValue<T, P>
    loader: ResourceValue<T, P>
}

export function resource<T, P>(options: ResourceOptions<T, P>): Resource<T, P> {
    const calls = { index: 0 } 

    const resource: Resource<T, P> = reactive({
        error: undefined,
        loading: false,
        empty: true,
        status: 'EMPTY',
        value: undefined,
        reload: (value) => resolve(value || options.loader, resource, options, calls, ++calls.index)
    })

    if (options.initializer) {
        resolve(options.initializer, resource, options, calls, ++calls.index)
    } else if (options.loader) {
        resolve(options.loader, resource, options, calls, ++calls.index)
    }

    if (options.parameter) {
        if (isReactive(options.parameter)) {
            watch(options.parameter, () => resource.reload())
        } else {
            for (const parameter of Object.values(options.parameter)) {
                watch(parameter, () => resource.reload())
            }
        }
    }
    return resource
}

export function unwrapParameters<P>(parameters?: ResourceParameter<P>): P | undefined {
    if (!parameters) return;
    if (isRef(parameters) || isReactive(parameters)) return toRaw(parameters) as P;
    return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, isRef(value) || isReactive(parameters) ? toRaw(value) : value])) as P;
}

function resolve<T, P>(value: ResourceValue<T, P>, resource: MutableResource<T, P>, options: ResourceOptions<T, P>, calls: { index: number }, index: number): Promise<T | undefined> | T | undefined {
    const parameter = unwrapParameters(options.parameter)
    const handleSuccess = (value: T | undefined) => {
        if (index < calls.index) return value
        resource.value = value
        resource.error = undefined
        resource.empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
        resource.status = resource.empty ? 'EMPTY' : 'RESOLVED'
        resource.loading = false
        return value
    }
    const handleError = (error: unknown) => {
        if (index < calls.index) return value
        resource.error = error as Error
        resource.status = 'ERROR'
        resource.loading = false
        return error
    }

    resource.loading = true
    resource.status = 'LOADING'

    try {
        const result = typeof value === 'function' ? (value as (parameter: P) => Promise<T> | T | undefined)(parameter as unknown as P) : value as Promise<T | undefined> | T | undefined
        if (result instanceof Promise) {
            return result.then(result => handleSuccess(result)).catch(error => { throw handleError(error) })
        } else {
            return handleSuccess(result)
        }
    } catch(error) {
        handleError(error)
    }

    return undefined
}