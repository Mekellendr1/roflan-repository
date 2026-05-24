import type { ReactNode } from 'react'
import { badgeColors } from '../lib/utils'

const AV_SIZES = { 
  sm: 'w-8 h-8 text-xs', 
  md: 'w-10 h-10 text-sm', 
  lg: 'w-14 h-14 text-lg' 
}

const AV_COLORS = {
  red: 'bg-red-50 text-red-700 border border-red-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  slate: 'bg-slate-100 text-slate-700 border border-slate-300',
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
      className={`${AV_SIZES[size]} ${AV_COLORS[color]} rounded-md font-semibold flex items-center justify-center flex-shrink-0 text-center`}
    >
      {initials}
    </div>
  )
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: ReactNode
  color?: keyof typeof badgeColors
}) {
  const colorClass = badgeColors[color] || 'bg-slate-100 text-slate-700 border-slate-200'
  return (
    <span
      className={`${colorClass} text-xs px-2.5 py-1 rounded-md border font-medium whitespace-nowrap inline-block`}
    >
      {children}
    </span>
  )
}

export function RiskGauge({ value, size = 56 }: { value: number; size?: number }) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const offset = c * (1 - value)
  const color =
    value >= 0.7 ? '#dc2626' : value >= 0.5 ? '#ea580c' : value >= 0.3 ? '#d97706' : '#16a34a'
  
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e5e5" strokeWidth="5" />
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
        className="rotate-90 font-bold"
        style={{ transformOrigin: 'center', fontSize: size * 0.26, fill: color }}
      >
        {Math.round(value * 100)}
      </text>
    </svg>
  )
}