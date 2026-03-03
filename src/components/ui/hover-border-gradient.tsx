"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT"

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ")
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "div",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType
    containerClassName?: string
    className?: string
    duration?: number
    clockwise?: boolean
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState(false)
  const [direction, setDirection] = useState<Direction>("TOP")
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    const update = () => {
      setIsDark(
        root.classList.contains("theme-dark") ||
        root.classList.contains("dark") ||
        root.getAttribute("data-theme") === "dark",
      )
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => observer.disconnect()
  }, [])

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"]
    const currentIndex = directions.indexOf(currentDirection)
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length
    return directions[nextIndex]
  }

  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(20.7% 50% at 50% 0%, var(--hbg-spot) 0%, rgba(255,255,255,0) 100%)",
    LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, var(--hbg-spot) 0%, rgba(255,255,255,0) 100%)",
    BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, var(--hbg-spot) 0%, rgba(255,255,255,0) 100%)",
    RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, var(--hbg-spot) 0%, rgba(255,255,255,0) 100%)",
  }

  const highlight =
    "radial-gradient(75% 181.16% at 50% 50%, var(--hbg-highlight) 0%, rgba(255,255,255,0) 100%)"

  useEffect(() => {
    if (hovered) return
    const interval = setInterval(() => {
      setDirection((prevState) => rotateDirection(prevState))
    }, duration * 1000)
    return () => clearInterval(interval)
  }, [hovered, duration, clockwise])

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative isolate flex h-min w-fit items-center justify-center overflow-hidden rounded-full border border-transparent p-px",
        containerClassName,
      )}
      style={{ backgroundColor: "var(--hbg-surface)" }}
      {...props}
    >
      <div className={cn("relative z-[2] w-auto rounded-[inherit]", className)}>
        {children}
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{
          width: "100%",
          height: "100%",
          filter: `blur(${isDark ? 1 : 0.5}px)`,
          boxShadow: isDark
            ? "inset 0 0 0 2px var(--hbg-edge)"
            : "inset 0 0 0 2px var(--hbg-edge), inset 0 0 14px rgba(30,64,175,0.36)",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration }}
      />

      <div
        className="pointer-events-none absolute inset-[1.5px] z-[1] rounded-[inherit]"
        style={{ backgroundColor: "var(--hbg-inner)" }}
      />
    </Tag>
  )
}
