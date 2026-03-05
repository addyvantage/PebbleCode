import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { PlacementMcqQuestion } from '../../data/placementBank'

type McqQuestionCardProps = {
  question: PlacementMcqQuestion
  questionNumber: number
  selectedIndex: number | null
  onSelect: (optionIndex: number) => void
}

function optionClass(isSelected: boolean) {
  return `w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${
    isSelected
      ? 'border-pebble-accent/55 bg-pebble-accent/16 text-pebble-text-primary shadow-[0_12px_26px_rgba(2,8,23,0.18),inset_0_1px_0_rgba(255,255,255,0.14)]'
      : 'border-pebble-border/30 bg-pebble-overlay/[0.05] text-pebble-text-secondary hover:border-pebble-border/48 hover:bg-pebble-overlay/[0.11] hover:text-pebble-text-primary'
  }`
}

export function McqQuestionCard({
  question,
  questionNumber,
  selectedIndex,
  onSelect,
}: McqQuestionCardProps) {
  return (
    <Card padding="lg" className="space-y-5 rounded-[18px]" interactive>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-pebble-text-muted">
            Multiple choice
          </p>
          <Badge variant="neutral">{question.difficulty}</Badge>
        </div>
        <h2 className="text-balance text-[1.75rem] font-semibold tracking-[-0.01em] text-pebble-text-primary sm:text-[1.9rem]">
          {questionNumber}. {question.prompt}
        </h2>
      </div>

      <div className="grid gap-3">
        {question.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={optionClass(selectedIndex === index)}
            onClick={() => onSelect(index)}
          >
            <span className="mr-2 text-pebble-text-muted">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
    </Card>
  )
}
