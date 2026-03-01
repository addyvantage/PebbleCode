"use client"

import React from "react"
import type { CSSProperties } from "react"

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ")
}

interface TextShimmerProps {
    children: string
    as?: React.ElementType
    className?: string
    duration?: number
    spread?: number
}

export function TextShimmer({
    children,
    as: Component = "span",
    className,
    duration = 2.6,
    spread = 1.8,
}: TextShimmerProps) {
    const dynamicSpread = React.useMemo(() => {
        return children.length * spread
    }, [children, spread])

    return (
        <Component
            className={cn(
                "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
                "[background-image:linear-gradient(110deg,transparent_35%,var(--base-gradient-color,#1d4ed8)_50%,transparent_65%),linear-gradient(var(--base-color,#0f2952),var(--base-color,#0f2952))]",
                "[background-repeat:no-repeat,no-repeat]",
                'motion-safe:[animation:shimmer_var(--shimmer-duration,2.6s)_linear_infinite]',
                // brand locked colors: navy base, vibrant blue shimmer
                '[--base-color:#0c1b4d]',
                '[--base-gradient-color:#2563eb]',
                className
            )}
            style={
                {
                    "--shimmer-duration": `${duration}s`,
                    "--spread": `${dynamicSpread}px`,
                } as CSSProperties
            }
        >
            {children}
        </Component>
    )
}
