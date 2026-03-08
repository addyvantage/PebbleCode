const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const RAW_OPTIONAL_API_ROUTES = (import.meta.env.VITE_OPTIONAL_API_ROUTES as string | undefined)?.trim().toLowerCase()

function normalizeBaseUrl(value: string | undefined) {
    if (!value) return ''
    return value.replace(/\/+$/, '')
}

const API_BASE_URL = normalizeBaseUrl(RAW_API_BASE_URL)

function joinApiBaseAndPath(base: string, path: string) {
    if (!base) return path

    const baseEndsWithApi = /\/api$/i.test(base)
    const pathStartsWithApi = /^\/api(?:\/|$)/i.test(path)
    if (baseEndsWithApi && pathStartsWithApi) {
        return `${base}${path.replace(/^\/api/i, '')}`
    }

    return `${base}${path}`
}

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return joinApiBaseAndPath(API_BASE_URL, normalizedPath)
}

export function apiFetch(input: string, init?: RequestInit) {
    return fetch(apiUrl(input), init)
}

export function apiEventSource(path: string) {
    return new EventSource(apiUrl(path))
}

export function resolveApiAssetUrl(pathOrUrl: string | null | undefined) {
    if (!pathOrUrl) return undefined
    if (/^https?:\/\//i.test(pathOrUrl)) {
        return pathOrUrl
    }
    return apiUrl(pathOrUrl)
}

export function getApiBaseUrl() {
    return API_BASE_URL
}

export function optionalApiRoutesAvailable() {
    if (RAW_OPTIONAL_API_ROUTES === 'true') return true
    if (RAW_OPTIONAL_API_ROUTES === 'false') return false
    return !API_BASE_URL
}
