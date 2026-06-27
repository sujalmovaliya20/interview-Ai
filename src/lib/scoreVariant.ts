/**
 * Semantic score-to-color variant system.
 * Every score-driven UI element MUST derive its color from this function.
 */

export type ScoreVariant = 'danger' | 'warning' | 'success'

export function getScoreVariant(score: number): ScoreVariant {
  if (score < 4) return 'danger'
  if (score < 7) return 'warning'
  return 'success'
}

export const variantStyles: Record<ScoreVariant, { bg: string; text: string; border: string }> = {
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
}

/** Readiness text → variant mapping */
export function getReadinessVariant(readiness: string): ScoreVariant {
  const lower = readiness.toLowerCase()
  if (lower.includes('not ready')) return 'danger'
  if (lower.includes('almost')) return 'warning'
  return 'success'
}
