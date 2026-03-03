import { useEffect, useState } from 'react'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316', '#A78BFA']

interface Particle {
    id: number
    x: number
    color: string
    size: number
    delay: number
    duration: number
    isCircle: boolean
}

function makeParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        size: Math.random() * 7 + 6,
        delay: Math.random() * 2.5,
        duration: Math.random() * 2 + 2.5,
        isCircle: Math.random() > 0.55,
    }))
}

export function Confetti({ count = 70 }: { count?: number }) {
    const [particles] = useState(() => makeParticles(count))
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    if (!mounted) return null

    return (
        <div
            className="pointer-events-none fixed inset-0 overflow-hidden"
            style={{ zIndex: 9999 }}
            aria-hidden="true"
        >
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: '-20px',
                        width: p.size,
                        height: p.isCircle ? p.size : p.size * 0.55,
                        backgroundColor: p.color,
                        borderRadius: p.isCircle ? '50%' : '2px',
                        animationName: 'confetti-fall',
                        animationTimingFunction: 'ease-in',
                        animationFillMode: 'forwards',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </div>
    )
}
