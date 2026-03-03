import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { forgotPassword } from '../../lib/auth'

export function AuthForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [sent, setSent] = useState(false)
    const errorRef = useRef<HTMLParagraphElement>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Enter a valid email address')
            setTimeout(() => errorRef.current?.focus(), 0)
            return
        }
        setError('')
        setSubmitting(true)
        try {
            await forgotPassword(email.trim())
            setSent(true)
        } catch (err: any) {
            // On Cognito "UserNotFoundException" we still show sent to avoid enumeration
            setSent(true)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthShell>
            <div className="card-premium rounded-2xl p-7 sm:p-8">
                {sent ? (
                    /* ── Sent state ── */
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pebble-accent/15">
                                <MailCheck className="h-7 w-7 text-pebble-accent" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[1.5rem] font-bold tracking-tight text-pebble-text-primary">
                                Check your email
                            </h2>
                            <p className="mt-2 text-[13.5px] leading-relaxed text-pebble-text-secondary">
                                If <span className="font-medium text-pebble-text-primary">{email}</span> is
                                associated with a Pebble account, you'll receive a reset link shortly.
                            </p>
                        </div>
                        <Link
                            to="/auth/login"
                            className="inline-block text-[13px] font-medium text-pebble-accent hover:text-pebble-text-primary transition-colors"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                ) : (
                    /* ── Email input state ── */
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-[1.5rem] font-bold tracking-tight text-pebble-text-primary">
                                Forgot password?
                            </h2>
                            <p className="mt-1 text-[13.5px] text-pebble-text-secondary">
                                Enter your email and we'll send you a reset link.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <div>
                                <label
                                    htmlFor="forgot-email"
                                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-text-muted"
                                >
                                    Email
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    aria-invalid={error ? true : undefined}
                                    className="auth-input"
                                />
                                {error && (
                                    <p
                                        ref={errorRef}
                                        role="alert"
                                        tabIndex={-1}
                                        className="mt-1 text-[11.5px] text-red-400 outline-none"
                                    >
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="auth-button w-full"
                            >
                                {submitting ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>

                        <Link
                            to="/auth/login"
                            className="block text-center text-[13px] font-medium text-pebble-accent hover:text-pebble-text-primary transition-colors"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                )}
            </div>
        </AuthShell>
    )
}
