import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: 'red' | 'amber' | 'green' | 'stone' | 'lime'
}

const COLORS = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  stone: 'bg-stone-100 text-stone-700 border-stone-200',
  lime: 'bg-lime-50 text-lime-800 border-lime-200',
}

export default function Badge({ children, color = 'stone' }: BadgeProps) {
  return (
    <span className={`${COLORS[color]} text-xs px-2 py-0.5 rounded-md border font-medium whitespace-nowrap`}>
      {children}
    </span>
  )
}
