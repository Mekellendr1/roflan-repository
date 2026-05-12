import type { RiskColor, ConflictSeverity } from './types'

// Цветовые наборы для риск-уровней — используются везде
export const colorClasses: Record<RiskColor, { bg: string; text: string; border: string; soft: string }> = {
  red:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-500',     soft: 'bg-red-100' },
  amber: { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-500',   soft: 'bg-amber-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500', soft: 'bg-emerald-100' },
}

// Конфиг для серьёзности конфликтов
export const severityMap: Record<ConflictSeverity, { label: string; color: 'red' | 'amber' | 'stone' }> = {
  critical: { label: 'КРИТ', color: 'red' },
  warning:  { label: 'СРЕД', color: 'amber' },
  low:      { label: 'НИЗ',  color: 'stone' },
}

// Какой цвет у риск-скора по значению
export function riskScoreToColor(score: number): RiskColor {
  if (score >= 70) return 'red'
  if (score >= 40) return 'amber'
  return 'green'
}
