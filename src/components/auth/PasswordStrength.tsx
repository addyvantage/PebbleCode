function score(pw: string): 0 | 1 | 2 | 3 | 4 {
    if (!pw) return 0
    if (pw.length < 8) return 1
    const hasLower = /[a-z]/.test(pw)
    const hasUpper = /[A-Z]/.test(pw)
    const hasDigit = /[0-9]/.test(pw)
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw)
    const extra = [hasLower && hasUpper, hasDigit, hasSpecial, pw.length >= 12].filter(Boolean).length
    return Math.min(4, 1 + extra) as 0 | 1 | 2 | 3 | 4
}

const META = {
    1: { label: 'Weak',   bar: 'bg-red-500',      text: 'text-red-400' },
    2: { label: 'Fair',   bar: 'bg-amber-400',    text: 'text-amber-400' },
    3: { label: 'Good',   bar: 'bg-yellow-400',   text: 'text-yellow-500' },
    4: { label: 'Strong', bar: 'bg-emerald-500',  text: 'text-emerald-500' },
} as const

export function PasswordStrength({ password }: { password: string }) {
    if (!password) return null
    const s = score(password)
    if (s === 0) return null
    const { label, bar, text } = META[s as 1]

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? bar : 'bg-pebble-border/20'}`}
                    />
                ))}
            </div>
            <p className={`text-[11px] font-medium ${text}`}>{label}</p>
        </div>
    )
}
