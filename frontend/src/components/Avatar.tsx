import type { RiskColor } from '../lib/types'

interface AvatarProps {
  initials: string
  color?: RiskColor | 'blue'
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
}

const COLORS = {
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
}

export default function Avatar({ initials, color = 'blue', size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${SIZES[size]} ${COLORS[color]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}
