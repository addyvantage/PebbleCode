/**
 * Auth wrapper:
 * - Login/signup/confirm/resend go through backend (/api/auth/*), so
 *   username-or-email login and username uniqueness rules are server-enforced.
 * - Forgot-password remains on Cognito browser SDK for now.
 */
import {
    CognitoUserPool,
    CognitoUser,
    CognitoUserSession,
} from 'amazon-cognito-identity-js'

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined
const USER_POOL_ID_FALLBACK = (import.meta.env as Record<string, unknown>).COGNITO_USER_POOL_ID as string | undefined
const CLIENT_ID_FALLBACK = (import.meta.env as Record<string, unknown>).COGNITO_CLIENT_ID as string | undefined

const RESOLVED_USER_POOL_ID = USER_POOL_ID ?? USER_POOL_ID_FALLBACK
const RESOLVED_CLIENT_ID = CLIENT_ID ?? CLIENT_ID_FALLBACK

const isConfigured = Boolean(RESOLVED_USER_POOL_ID && RESOLVED_CLIENT_ID)
const TOKEN_STORAGE_KEY = 'pebble.auth.idToken'

function maskEnvValue(value?: string) {
    if (!value) {
        return 'missing'
    }
    if (value.length <= 6) {
        return `${value.slice(0, 1)}***${value.slice(-1)}`
    }
    return `${value.slice(0, 3)}***${value.slice(-3)}`
}

if (import.meta.env.DEV) {
    const detected = {
        VITE_COGNITO_USER_POOL_ID: maskEnvValue(USER_POOL_ID),
        COGNITO_USER_POOL_ID: maskEnvValue(USER_POOL_ID_FALLBACK),
        VITE_COGNITO_CLIENT_ID: maskEnvValue(CLIENT_ID),
        COGNITO_CLIENT_ID: maskEnvValue(CLIENT_ID_FALLBACK),
        resolved: {
            userPoolId: maskEnvValue(RESOLVED_USER_POOL_ID),
            clientId: maskEnvValue(RESOLVED_CLIENT_ID),
            source: USER_POOL_ID && CLIENT_ID ? 'VITE_' : (USER_POOL_ID_FALLBACK && CLIENT_ID_FALLBACK ? 'COGNITO_' : 'incomplete'),
        },
    }
    console.debug('[auth] Cognito env detection', detected)
}

let userPool: CognitoUserPool | null = null
if (isConfigured) {
    userPool = new CognitoUserPool({
        UserPoolId: RESOLVED_USER_POOL_ID!,
        ClientId: RESOLVED_CLIENT_ID!,
    })
}

export function isCognitoConfigured(): boolean {
    return isConfigured
}

export type AuthUser = {
    userId: string
    email: string
}

function decodeJwtSegment(segment: string): string {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
    return atob(padded)
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const [, payload] = token.split('.')
        if (!payload) {
            return null
        }
        return JSON.parse(decodeJwtSegment(payload)) as Record<string, unknown>
    } catch {
        return null
    }
}

function tokenToUser(idToken: string): AuthUser | null {
    const payload = parseJwtPayload(idToken)
    if (!payload) return null
    const sub = payload.sub
    const email = payload.email ?? payload['cognito:username']
    if (typeof sub !== 'string') return null
    return {
        userId: sub,
        email: typeof email === 'string' ? email : '',
    }
}

function readStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
        return null
    }
}

function storeToken(token: string) {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } catch {
        // no-op
    }
}

function clearStoredToken() {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
    } catch {
        // no-op
    }
}

function isTokenExpired(idToken: string): boolean {
    const payload = parseJwtPayload(idToken)
    const exp = payload?.exp
    if (typeof exp !== 'number') return false
    return Date.now() >= exp * 1000
}

export async function getCurrentSession(): Promise<{ user: AuthUser; idToken: string } | null> {
    const stored = readStoredToken()
    if (stored && !isTokenExpired(stored)) {
        const user = tokenToUser(stored)
        if (user) {
            return { user, idToken: stored }
        }
    }

    // Fallback for legacy direct-Cognito sessions.
    if (!userPool) return null
    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) return null

    return new Promise((resolve) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session || !session.isValid()) {
                resolve(null)
                return
            }
            const idToken = session.getIdToken().getJwtToken()
            const user = tokenToUser(idToken)
            if (!user) {
                resolve(null)
                return
            }
            storeToken(idToken)
            resolve({ user, idToken })
        })
    })
}

export async function signIn(identifier: string, password: string): Promise<{ user: AuthUser; idToken: string }> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
    })
    const data = await res.json().catch(() => ({})) as {
        idToken?: string
        error?: string
        code?: string
        verificationEmail?: string
    }
    if (!res.ok || !data.idToken) {
        const error = new Error(data.error ?? 'Invalid username/email or password') as Error & {
            code?: string
            verificationEmail?: string
        }
        if (data.code) {
            error.code = data.code
        }
        if (data.verificationEmail) {
            error.verificationEmail = data.verificationEmail
        }
        throw error
    }
    const user = tokenToUser(data.idToken)
    if (!user) {
        throw new Error('Invalid authentication token')
    }
    storeToken(data.idToken)
    return { user, idToken: data.idToken }
}

export async function signUp(email: string, password: string, username: string): Promise<void> {
    const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
    })
    const data = await res.json().catch(() => ({})) as { error?: string; code?: string; reason?: string }
    if (!res.ok) {
        const error = new Error(data.error ?? 'Account creation failed. Please try again.') as Error & {
            code?: string
            reason?: string
        }
        if (data.code) {
            error.code = data.code
        }
        if (data.reason) {
            error.reason = data.reason
        }
        throw error
    }
}

export function signOut(): void {
    clearStoredToken()
    if (!userPool) return
    const cognitoUser = userPool.getCurrentUser()
    cognitoUser?.signOut()
}

export function confirmSignUp(email: string, code: string): Promise<void> {
    return fetch('/api/auth/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    }).then(async (res) => {
        const data = await res.json().catch(() => ({})) as { error?: string; code?: string }
        if (!res.ok) {
            const error = new Error(data.error ?? 'Verification failed') as Error & { code?: string }
            error.code = data.code
            throw error
        }
    })
}

export function resendSignUpCode(email: string): Promise<void> {
    return fetch('/api/auth/resend-signup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(async (res) => {
        const data = await res.json().catch(() => ({})) as { error?: string; code?: string }
        if (!res.ok) {
            const error = new Error(data.error ?? 'Failed to resend code') as Error & { code?: string }
            error.code = data.code
            throw error
        }
    })
}

export function forgotPassword(email: string): Promise<void> {
    if (!userPool) {
        return new Promise((resolve) => setTimeout(resolve, 800))
    }
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
    return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
            inputVerificationCode: () => resolve(),
        })
    })
}
