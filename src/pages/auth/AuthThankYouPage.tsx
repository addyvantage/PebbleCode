import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Confetti } from '../../components/auth/Confetti'
import { useAuth } from '../../hooks/useAuth'

export function AuthThankYouPage() {
    const { isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()

    // If user is not authenticated (e.g. direct URL access), redirect to login
    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate('/auth/login', { replace: true })
    }, [isAuthenticated, isLoading, navigate])

    return (
        <AuthShell>
            <Confetti />
            <div className="card-premium rounded-2xl p-7 sm:p-8 text-center space-y-6">
                {/* Success icon */}
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
                        <CheckCircle className="h-8 w-8 text-emerald-500" strokeWidth={1.75} />
                    </div>
                </div>

                {/* Copy */}
                <div className="space-y-2">
                    <h2 className="text-[1.6rem] font-bold tracking-tight text-pebble-text-primary">
                        You're in! 🎉
                    </h2>
                    <p className="text-[14px] leading-relaxed text-pebble-text-secondary">
                        Welcome to Pebble. Your account is ready — let's start coding.
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={() => navigate('/')}
                    className="auth-button w-full"
                >
                    Go to dashboard
                </button>
            </div>
        </AuthShell>
    )
}
