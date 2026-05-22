import type { RiskLevel } from './types'

export const riskColor: Record<
  RiskLevel,
  { text: string; bg: string; border: string; label: string; dot: string }
> = {
  low: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500', label: 'низкий', dot: 'bg-emerald-500' },
  medium: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-500', label: 'средний', dot: 'bg-amber-500' },
  high: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-500', label: 'высокий', dot: 'bg-orange-500' },
  critical: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-500', label: 'критический', dot: 'bg-red-500' },
}

export const groupColors = {
  red: 'border-red-500 bg-red-50',
  amber: 'border-amber-500 bg-amber-50',
  green: 'border-emerald-500 bg-emerald-50',
  blue: 'border-blue-500 bg-blue-50',
  stone: 'border-stone-400 bg-stone-50',
}

export const badgeColors = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  stone: 'bg-stone-100 text-stone-700 border-stone-200',
  lime: 'bg-sky-100 text-sky-800 border-sky-300',
}

export function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

export function avatarColor(level: RiskLevel): 'red' | 'amber' | 'green' | 'blue' {
  if (level === 'critical' || level === 'high') return 'red'
  if (level === 'medium') return 'amber'
  return 'green'
}
