"use client"

import React from "react"
import type { CSSProperties } from "react"

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ")
}

interface TextShimmerProps {
    children: React.ReactNode
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
        const len = typeof children === 'string' ? children.length : Array.isArray(children) ? children.join('').length : 50;
        return len * spread
    }, [children, spread])

    return (
        <Component
            className={cn(
                "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
                "[background-image:linear-gradient(110deg,transparent_28%,var(--base-gradient-color,#e2eaff)_50%,transparent_72%),linear-gradient(var(--base-color,#a8bef5),var(--base-color,#a8bef5))]",
                "[background-repeat:no-repeat,no-repeat]",
                'motion-safe:[animation:shimmer_var(--shimmer-duration,2.6s)_linear_infinite]',
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
