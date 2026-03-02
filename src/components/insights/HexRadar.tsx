import { useEffect, useMemo, useState } from 'react'
import type { RadarAxisKey, RadarScores } from '../../lib/analyticsDerivers'
import { useTheme } from '../../hooks/useTheme'

type HexRadarProps = {
  current: RadarScores
  previous: RadarScores
  axisOrder: RadarAxisKey[]
  axisLabels: Record<RadarAxisKey, string>
  className?: string
}

const SIZE = 440
const CENTER = SIZE / 2
const OUTER_RADIUS = 136
const RINGS = 5
const LABEL_OFFSET = 32
const LABEL_EDGE_PADDING = 12

// Pill label constants
const LABEL_FONT_SIZE = 14       // up from 13px
const LABEL_CHAR_WIDTH = 8.0     // avg char width at 14px semi-bold
const PILL_PAD_X = 10            // horizontal inner padding
const PILL_PAD_Y = 5             // vertical inner padding

function toPoint(index: number, total: number, score01: number) {
  const angle = (-Math.PI / 2) + (index / total) * Math.PI * 2
  const radius = OUTER_RADIUS * score01
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  }
}

function pointsToPath(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function HexRadar({
  current,
  previous,
  axisOrder,
  axisLabels,
  className,
}: HexRadarProps) {
  const { theme } = useTheme()
  const [reveal, setReveal] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReveal(true), 24)
    return () => window.clearTimeout(timer)
  }, [current, previous])

  const axisPoints = useMemo(
    () =>
      axisOrder.map((_, index) => toPoint(index, axisOrder.length, 1)),
    [axisOrder],
  )

  const ringPolygons = useMemo(
    () =>
      Array.from({ length: RINGS }, (_, ringIndex) => {
        const ratio = (ringIndex + 1) / RINGS
        return axisOrder.map((_, axisIndex) => toPoint(axisIndex, axisOrder.length, ratio))
      }),
    [axisOrder],
  )

  const currentPoints = useMemo(
    () =>
      axisOrder.map((key, index) => toPoint(index, axisOrder.length, Math.max(0, Math.min(1, current[key] / 100)))),
    [axisOrder, current],
  )
  const previousPoints = useMemo(
    () =>
      axisOrder.map((key, index) =>
        toPoint(index, axisOrder.length, Math.max(0, Math.min(1, previous[key] / 100))),
      ),
    [axisOrder, previous],
  )
  const chartStyle = useMemo(() => {
    const dark = theme === 'dark'
    return {
      gridStroke: dark ? 'rgb(var(--pebble-border) / 0.25)' : 'rgb(var(--pebble-border) / 0.22)',
      boundaryStroke: dark ? 'rgb(var(--pebble-border) / 0.46)' : 'rgb(var(--pebble-border) / 0.38)',
      axisStroke: dark ? 'rgb(var(--pebble-border) / 0.22)' : 'rgb(var(--pebble-border) / 0.2)',
      currentFill: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)',
      currentStroke: dark ? 'rgba(255, 255, 255, 0.74)' : 'rgba(15, 23, 42, 0.66)',
      previousStroke: dark ? 'rgb(var(--pebble-accent) / 0.58)' : 'rgb(var(--pebble-accent) / 0.52)',
      labelFill: dark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 25, 55, 0.88)',
      pillBg: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 30, 60, 0.07)',
      pillBorder: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(20, 30, 60, 0.15)',
      currentDotFill: dark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
      currentDotStroke: dark ? 'rgb(var(--pebble-canvas) / 0.9)' : 'rgb(var(--pebble-canvas) / 0.85)',
      centerDot: dark ? 'rgb(var(--pebble-border) / 0.8)' : 'rgb(var(--pebble-border) / 0.85)',
      polygonFilter: dark ? 'drop-shadow(0 0 10px rgba(248,250,252,0.16))' : 'drop-shadow(0 2px 8px rgba(15,23,42,0.1))',
      gridFillOdd: dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
      gridFillEven: 'transparent',
    }
  }, [theme])

  return (
    <div className={classNames('h-full w-full', className)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
        {[...ringPolygons].reverse().map((ring, reverseIndex) => {
          const originalIndex = RINGS - 1 - reverseIndex
          return (
            <polygon
              key={`ring-${originalIndex}`}
              points={pointsToPath(ring)}
              fill={originalIndex % 2 === 0 ? chartStyle.gridFillOdd : chartStyle.gridFillEven}
              stroke={originalIndex === RINGS - 1 ? chartStyle.boundaryStroke : chartStyle.gridStroke}
              strokeWidth={originalIndex === RINGS - 1 ? 1.55 : 1}
            />
          )
        })}

        {axisPoints.map((point, index) => (
          <line
            key={`axis-${index}`}
            x1={CENTER}
            y1={CENTER}
            x2={point.x}
            y2={point.y}
            stroke={chartStyle.axisStroke}
            strokeWidth={1}
          />
        ))}

        <polygon
          points={pointsToPath(previousPoints)}
          fill="none"
          stroke={chartStyle.previousStroke}
          strokeDasharray="5 5"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{
            opacity: reveal ? 1 : 0,
            transition: 'opacity 280ms ease',
          }}
        />

        <polygon
          points={pointsToPath(currentPoints)}
          fill={chartStyle.currentFill}
          stroke={chartStyle.currentStroke}
          strokeWidth="2.1"
          strokeLinejoin="round"
          style={{
            opacity: reveal ? 1 : 0,
            filter: chartStyle.polygonFilter,
            transformOrigin: '50% 50%',
            transform: reveal ? 'scale(1)' : 'scale(0.96)',
            transition: 'opacity 280ms ease, transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />

        {currentPoints.map((point, index) => (
          <circle
            key={`current-dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={chartStyle.currentDotFill}
            stroke={chartStyle.currentDotStroke}
            strokeWidth="1.4"
            style={{
              opacity: reveal ? 1 : 0,
              transition: 'opacity 260ms ease',
            }}
          />
        ))}

        <circle cx={CENTER} cy={CENTER} r="2.6" fill={chartStyle.centerDot} />

        {axisPoints.map((point, index) => {
          const label = axisLabels[axisOrder[index]]
          const dx = point.x - CENTER
          const dy = point.y - CENTER
          const vectorLength = Math.sqrt(dx * dx + dy * dy) || 1
          const rawX = point.x + (dx / vectorLength) * LABEL_OFFSET
          const rawY = point.y + (dy / vectorLength) * LABEL_OFFSET
          const labelX = Math.min(SIZE - LABEL_EDGE_PADDING, Math.max(LABEL_EDGE_PADDING, rawX))
          const labelY = Math.min(SIZE - LABEL_EDGE_PADDING, Math.max(LABEL_EDGE_PADDING, rawY))

          const anchor = Math.abs(dx) < 20 ? 'middle' : dx > 0 ? 'start' : 'end'
          const domBaseline = Math.abs(dy) < 16 ? 'middle' : dy > 0 ? 'hanging' : 'auto'

          const pillW = label.length * LABEL_CHAR_WIDTH + PILL_PAD_X * 2
          const pillH = LABEL_FONT_SIZE + PILL_PAD_Y * 2

          // Align pill rect x with text anchor
          const rectX = anchor === 'middle'
            ? labelX - pillW / 2
            : anchor === 'start'
              ? labelX - PILL_PAD_X
              : labelX - pillW + PILL_PAD_X

          // Align pill rect y with dominantBaseline
          const rectY = domBaseline === 'middle'
            ? labelY - pillH / 2
            : domBaseline === 'hanging'
              ? labelY - PILL_PAD_Y
              : labelY - LABEL_FONT_SIZE * 0.85 - PILL_PAD_Y

          return (
            <g key={`label-${axisOrder[index]}`}>
              <rect
                x={rectX}
                y={rectY}
                width={pillW}
                height={pillH}
                rx={999}
                ry={999}
                fill={chartStyle.pillBg}
                stroke={chartStyle.pillBorder}
                strokeWidth={1}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                dominantBaseline={domBaseline}
                fill={chartStyle.labelFill}
                fontSize={LABEL_FONT_SIZE}
                fontWeight="650"
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
