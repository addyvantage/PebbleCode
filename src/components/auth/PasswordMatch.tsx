import { Check, X } from 'lucide-react'

interface Props {
    password: string
    confirm: string
}

export function PasswordMatch({ password, confirm }: Props) {
    if (!confirm) return null
    const match = password === confirm
    return (
        <p className={`mt-1 flex items-center gap-1 text-[11.5px] font-medium ${match ? 'text-emerald-500' : 'text-red-400'}`}>
            {match
                ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                : <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            }
            {match ? 'Passwords match' : 'Passwords do not match'}
        </p>
    )
}
