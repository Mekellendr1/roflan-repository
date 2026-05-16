import type { ReactNode } from 'react'
import { badgeColors } from '../lib/utils'

const AV_SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
const AV_COLORS = {
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
}

export function Avatar({
  initials,
  color = 'blue',
  size = 'md',
}: {
  initials: string
  color?: keyof typeof AV_COLORS
  size?: keyof typeof AV_SIZES
}) {
  return (
    <div
      className={`${AV_SIZES[size]} ${AV_COLORS[color]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

export function Badge({
  children,
  color = 'stone',
}: {
  children: ReactNode
  color?: keyof typeof badgeColors
}) {
  return (
    <span
      className={`${badgeColors[color]} text-xs px-2 py-0.5 rounded-md border font-medium whitespace-nowrap`}
    >
      {children}
    </span>
  )
}

// Кольцевой индикатор риска (SVG)
export function RiskGauge({ value, size = 56 }: { value: number; size?: number }) {
  // value 0..1
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const offset = c * (1 - value)
  const color =
    value >= 0.7 ? '#dc2626' : value >= 0.5 ? '#ea580c' : value >= 0.3 ? '#d97706' : '#16a34a'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90 font-mono font-bold"
        style={{ transformOrigin: 'center', fontSize: size * 0.26, fill: color }}
      >
        {Math.round(value * 100)}
      </text>
    </svg>
  )
}
