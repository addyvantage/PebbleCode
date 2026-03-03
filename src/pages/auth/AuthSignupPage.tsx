import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrength } from '../../components/auth/PasswordStrength'
import { PasswordMatch } from '../../components/auth/PasswordMatch'
import { useAuth } from '../../hooks/useAuth'

export function AuthSignupPage() {
    const { signUp, isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) navigate('/', { replace: true })
    }, [isAuthenticated, isLoading, navigate])

    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [errors, setErrors] = useState<{
        email?: string
        username?: string
        password?: string
        confirm?: string
        form?: string
    }>({})
    const [submitting, setSubmitting] = useState(false)
    const errorRef = useRef<HTMLDivElement>(null)

    function validate() {
        const e: typeof errors = {}
        if (!email.trim())
            e.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            e.email = 'Enter a valid email address'

        if (!username.trim())
            e.username = 'Username is required'
        else if (username.length < 3 || username.length > 20)
            e.username = 'Username must be 3–20 characters'
        else if (!/^[a-zA-Z0-9_]+$/.test(username))
            e.username = 'Only letters, numbers, and underscores allowed'

        if (!password)
            e.password = 'Password is required'
        else if (password.length < 8)
            e.password = 'Password must be at least 8 characters'

        if (!confirm)
            e.confirm = 'Please confirm your password'
        else if (password !== confirm)
            e.confirm = 'Passwords do not match'

        return e
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) {
            setErrors(errs)
            setTimeout(() => errorRef.current?.focus(), 0)
            return
        }
        setErrors({})
        setSubmitting(true)
        try {
            await signUp(email.trim(), password, username.trim())
            // Store email for verify page (survives refresh)
            localStorage.setItem('pebble.auth.verifyEmail', email.trim())
            // Start resend cooldown from signup moment
            localStorage.setItem('pebble.auth.resendAt', String(Date.now() + 120_000))
            navigate(`/auth/verify?email=${encodeURIComponent(email.trim())}`)
        } catch (err: any) {
            setErrors({ form: err?.message ?? 'Account creation failed. Please try again.' })
            setTimeout(() => errorRef.current?.focus(), 0)
        } finally {
            setSubmitting(false)
        }
    }

    const hasErrors = Object.values(errors).some(Boolean)

    return (
        <AuthShell>
            <div className="card-premium rounded-2xl p-7 sm:p-8 space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-[1.5rem] font-bold tracking-tight text-pebble-text-primary">
                        Create your account
                    </h2>
                    <p className="mt-1 text-[13.5px] text-pebble-text-secondary">
                        Start your free learning journey
                    </p>
                </div>

                {/* Error summary */}
                {hasErrors && (
                    <div
                        ref={errorRef}
                        tabIndex={-1}
                        role="alert"
                        aria-live="assertive"
                        className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[12.5px] text-red-400 outline-none space-y-0.5"
                    >
                        {errors.form     && <p>{errors.form}</p>}
                        {errors.email    && <p>{errors.email}</p>}
                        {errors.username && <p>{errors.username}</p>}
                        {errors.password && <p>{errors.password}</p>}
                        {errors.confirm  && <p>{errors.confirm}</p>}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="signup-email"
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-text-muted"
                        >
                            Email
                        </label>
                        <input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            aria-invalid={errors.email ? true : undefined}
                            className="auth-input"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="signup-username"
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-text-muted"
                        >
                            Username
                        </label>
                        <input
                            id="signup-username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="cool_dev_42"
                            minLength={3}
                            maxLength={20}
                            aria-invalid={errors.username ? true : undefined}
                            aria-describedby="signup-username-hint"
                            className="auth-input"
                        />
                        <p id="signup-username-hint" className="mt-1 text-[11px] text-pebble-text-muted">
                            3–20 characters · letters, numbers, underscores
                        </p>
                    </div>

                    {/* Password */}
                    <div>
                        <PasswordInput
                            id="signup-password"
                            label="Password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            error={errors.password}
                        />
                        <PasswordStrength password={password} />
                    </div>

                    {/* Confirm password */}
                    <div>
                        <PasswordInput
                            id="signup-confirm"
                            label="Confirm Password"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="••••••••"
                            error={errors.confirm}
                        />
                        <PasswordMatch password={password} confirm={confirm} />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="auth-button w-full mt-2"
                    >
                        {submitting ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                {/* Switch to login */}
                <p className="text-center text-[13px] text-pebble-text-secondary">
                    Already have an account?{' '}
                    <Link
                        to="/auth/login"
                        className="font-medium text-pebble-accent hover:text-pebble-text-primary transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthShell>
    )
}
