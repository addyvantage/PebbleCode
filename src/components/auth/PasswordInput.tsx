import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    id: string
    error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ label, id, error, className = '', ...props }, ref) => {
        const [visible, setVisible] = useState(false)

        return (
            <div>
                {label && (
                    <label
                        htmlFor={id}
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-pebble-text-muted"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        id={id}
                        type={visible ? 'text' : 'password'}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-err` : undefined}
                        className={`auth-input pr-10 ${className}`}
                        {...props}
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        onClick={() => setVisible((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-pebble-text-muted hover:text-pebble-text-secondary transition-colors"
                    >
                        {visible
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />
                        }
                    </button>
                </div>
                {error && (
                    <p id={`${id}-err`} className="mt-1 text-[11.5px] text-red-400">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
PasswordInput.displayName = 'PasswordInput'
