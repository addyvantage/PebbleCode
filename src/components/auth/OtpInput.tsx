import { useEffect, useRef } from 'react'

const LENGTH = 6

interface OtpInputProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    hasError?: boolean
    autoFocus?: boolean
}

export function OtpInput({ value, onChange, disabled, hasError, autoFocus }: OtpInputProps) {
    const refs = useRef<(HTMLInputElement | null)[]>(Array.from({ length: LENGTH }, () => null))

    useEffect(() => {
        if (autoFocus) refs.current[0]?.focus()
    }, [autoFocus])

    // Derive per-slot display value from the string
    const slots = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '')

    function emit(newSlots: string[]) {
        // Compact: remove trailing empties, join
        let last = newSlots.length - 1
        while (last >= 0 && !newSlots[last]) last--
        onChange(newSlots.slice(0, last + 1).join(''))
    }

    function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
        const digit = e.target.value.replace(/\D/g, '').slice(-1)
        const next = [...slots]
        next[i] = digit
        emit(next)
        if (digit && i < LENGTH - 1) refs.current[i + 1]?.focus()
    }

    function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace') {
            if (slots[i]) {
                const next = [...slots]
                next[i] = ''
                emit(next)
            } else if (i > 0) {
                refs.current[i - 1]?.focus()
            }
        } else if (e.key === 'ArrowLeft' && i > 0) {
            refs.current[i - 1]?.focus()
        } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
            refs.current[i + 1]?.focus()
        }
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault()
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
        onChange(text)
        refs.current[Math.min(text.length, LENGTH - 1)]?.focus()
    }

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {slots.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`otp-digit${hasError ? ' otp-error' : ''}`}
                    aria-label={`Digit ${i + 1} of ${LENGTH}`}
                />
            ))}
        </div>
    )
}
