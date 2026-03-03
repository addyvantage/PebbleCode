import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import {
    getCurrentSession,
    signIn as cognitoSignIn,
    signUp as cognitoSignUp,
    signOut as cognitoSignOut,
    confirmSignUp as cognitoConfirmSignUp,
    resendSignUpCode as cognitoResendSignUpCode,
    isCognitoConfigured,
    type AuthUser,
} from '../lib/auth'

export type UserProfile = {
    userId: string
    username: string
    email: string
    bio: string
    avatarUrl: string | null
    role: 'user' | 'admin'
}

export type AuthContextValue = {
    user: AuthUser | null
    profile: UserProfile | null
    isAuthenticated: boolean
    isAdmin: boolean
    isLoading: boolean
    isConfigured: boolean
    idToken: string | null
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username: string) => Promise<void>
    confirmSignUp: (email: string, code: string) => Promise<void>
    resendSignUpCode: (email: string) => Promise<void>
    signOut: () => void
    refreshProfile: () => Promise<void>
    setGuestMode: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const DEV_GUEST_USER: AuthUser = { userId: 'dev-guest', email: 'guest@pebble.dev' }
const DEV_GUEST_PROFILE: UserProfile = {
    userId: 'dev-guest',
    username: 'Guest',
    email: 'guest@pebble.dev',
    bio: 'Dev mode guest',
    avatarUrl: null,
    role: 'user',
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [idToken, setIdToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const configured = isCognitoConfigured()

    const fetchProfile = useCallback(async (token: string) => {
        try {
            const res = await fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setProfile(data as UserProfile)
            }
        } catch {
            // Profile fetch failed — user is authed but profile not yet created
        }
    }, [])

    const refreshProfile = useCallback(async () => {
        if (idToken) await fetchProfile(idToken)
    }, [idToken, fetchProfile])

    // Restore session on mount
    useEffect(() => {
        let cancelled = false
        async function restore() {
            try {
                const session = await getCurrentSession()
                if (cancelled) return
                if (session) {
                    setUser(session.user)
                    setIdToken(session.idToken)
                    await fetchProfile(session.idToken)
                }
            } catch {
                // no session
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        restore()
        return () => { cancelled = true }
    }, [fetchProfile])

    const handleSignIn = useCallback(async (email: string, password: string) => {
        const result = await cognitoSignIn(email, password)
        setUser(result.user)
        setIdToken(result.idToken)
        await fetchProfile(result.idToken)
    }, [fetchProfile])

    // signUp only registers the user — Cognito sends a verification email.
    // Auto sign-in is NOT attempted here; the verify page handles confirmation.
    const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
        await cognitoSignUp(email, password, username)
    }, [])

    const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
        await cognitoConfirmSignUp(email, code)
    }, [])

    const handleResendSignUpCode = useCallback(async (email: string) => {
        await cognitoResendSignUpCode(email)
    }, [])

    const handleSignOut = useCallback(() => {
        cognitoSignOut()
        setUser(null)
        setProfile(null)
        setIdToken(null)
    }, [])

    const setGuestMode = useCallback(() => {
        if (import.meta.env.DEV) {
            setUser(DEV_GUEST_USER)
            setProfile(DEV_GUEST_PROFILE)
            setIdToken('dev-guest-token')
            setIsLoading(false)
        }
    }, [])

    const value: AuthContextValue = {
        user,
        profile,
        isAuthenticated: user !== null,
        isAdmin: profile?.role === 'admin',
        isLoading,
        isConfigured: configured,
        idToken,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        resendSignUpCode: handleResendSignUpCode,
        signOut: handleSignOut,
        refreshProfile,
        setGuestMode,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
