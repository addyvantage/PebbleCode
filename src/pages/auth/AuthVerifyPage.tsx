import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { OtpInput } from '../../components/auth/OtpInput'
import { useAuth } from '../../hooks/useAuth'

const VERIFY_EMAIL_KEY = 'pebble.auth.verifyEmail'
const RESEND_AT_KEY = 'pebble.auth.resendAt'
const COOLDOWN_MS = 120_000

function getSecondsLeft(): number {
    const at = Number(localStorage.getItem(RESEND_AT_KEY) ?? 0)
    return Math.max(0, Math.ceil((at - Date.now()) / 1000))
}

function formatCountdown(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
}

function normalizeError(err: any): string {
    switch (err?.code ?? err?.name) {
        case 'CodeMismatchException':
            return 'Incorrect code. Please check and try again.'
        case 'ExpiredCodeException':
            return 'This code has expired. Request a new one below.'
        case 'LimitExceededException':
            return 'Too many attempts. Please wait before trying again.'
        case 'TooManyRequestsException':
            return 'Too many requests. Please wait a moment.'
        case 'NotAuthorizedException':
            return 'This account is already confirmed. You can sign in.'
        default:
            return err?.message ?? 'Verification failed. Please try again.'
    }
}

export function AuthVerifyPage() {
    const { confirmSignUp, resendSignUpCode } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Resolve email: URL param → localStorage fallback
    const emailFromUrl = searchParams.get('email') ?? ''
    const emailFromStorage = localStorage.getItem(VERIFY_EMAIL_KEY) ?? ''
    const email = emailFromUrl || emailFromStorage

    // If no email, send to signup
    useEffect(() => {
        if (!email) navigate('/auth/signup', { replace: true })
    }, [email, navigate])

    // Persist email so page survives refresh
    useEffect(() => {
        if (email) localStorage.setItem(VERIFY_EMAIL_KEY, email)
    }, [email])

    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft)
    const errorRef = useRef<HTMLDivElement>(null)

    // Tick the countdown every 500 ms
    useEffect(() => {
        const id = setInterval(() => setSecondsLeft(getSecondsLeft()), 500)
        return () => clearInterval(id)
    }, [])

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        if (code.length < 6) return
        setError('')
        setVerifying(true)
        try {
            await confirmSignUp(email, code)
            // Clean up localStorage
            localStorage.removeItem(VERIFY_EMAIL_KEY)
            localStorage.removeItem(RESEND_AT_KEY)
            navigate(`/auth/login?email=${encodeURIComponent(email)}&verified=1`)
        } catch (err: any) {
            setError(normalizeError(err))
            setCode('')
            setTimeout(() => errorRef.current?.focus(), 0)
        } finally {
            setVerifying(false)
        }
    }

    async function handleResend() {
        if (secondsLeft > 0 || resending) return
        setError('')
        setResending(true)
        try {
            await resendSignUpCode(email)
            // Start cooldown
            localStorage.setItem(RESEND_AT_KEY, String(Date.now() + COOLDOWN_MS))
            setSecondsLeft(COOLDOWN_MS / 1000)
        } catch (err: any) {
            setError(normalizeError(err))
            setTimeout(() => errorRef.current?.focus(), 0)
        } finally {
            setResending(false)
        }
    }

    const canSubmit = code.length === 6 && !verifying
    const canResend = secondsLeft === 0 && !resending

    return (
        <AuthShell>
            <div className="card-premium rounded-2xl p-7 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pebble-accent/15">
                        <MailCheck className="h-6 w-6 text-pebble-accent" />
                    </div>
                    <div>
                        <h2 className="text-[1.5rem] font-bold tracking-tight text-pebble-text-primary">
                            Verify your email
                        </h2>
                        <p className="mt-1 text-[13.5px] text-pebble-text-secondary">
                            Enter the 6-digit code sent to{' '}
                            <span className="font-medium text-pebble-text-primary">{email}</span>
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        ref={errorRef}
                        tabIndex={-1}
                        role="alert"
                        aria-live="assertive"
                        className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-400 outline-none"
                    >
                        {error}
                    </div>
                )}

                {/* OTP form */}
                <form onSubmit={handleVerify} className="space-y-5">
                    <OtpInput
                        value={code}
                        onChange={setCode}
                        disabled={verifying}
                        hasError={!!error}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="auth-button w-full"
                    >
                        {verifying ? 'Verifying…' : 'Verify email'}
                    </button>
                </form>

                {/* Resend */}
                <div className="text-center space-y-1">
                    <p className="text-[13px] text-pebble-text-secondary">
                        Didn't receive a code?
                    </p>
                    {canResend ? (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="text-[13px] font-medium text-pebble-accent hover:text-pebble-text-primary transition-colors disabled:opacity-50"
                        >
                            {resending ? 'Sending…' : 'Resend code'}
                        </button>
                    ) : (
                        <p className="text-[13px] text-pebble-text-muted">
                            Resend available in{' '}
                            <span className="font-mono font-semibold text-pebble-text-secondary">
                                {formatCountdown(secondsLeft)}
                            </span>
                        </p>
                    )}
                </div>

                {/* Change email */}
                <p className="text-center text-[12.5px] text-pebble-text-muted">
                    Wrong email?{' '}
                    <Link
                        to="/auth/signup"
                        className="text-pebble-accent hover:text-pebble-text-primary transition-colors"
                    >
                        Change it
                    </Link>
                </p>
            </div>
        </AuthShell>
    )
}
