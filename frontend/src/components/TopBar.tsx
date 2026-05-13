import type { ReactNode } from 'react'
import Icon from './Icon'

interface TopBarProps {
  title: string
  subtitle?: string
  children?: ReactNode
  onRecalculate?: () => void
  recalculating?: boolean
}

export default function TopBar({
  title,
  subtitle,
  children,
  onRecalculate,
  recalculating,
}: TopBarProps) {
  return (
    <div className="bg-white border-b border-stone-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onRecalculate && (
          <button
            onClick={onRecalculate}
            disabled={recalculating}
            className="px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-2 font-medium text-stone-700 disabled:opacity-50"
          >
            <Icon name="refresh" className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Считаю...' : 'Пересчитать'}
          </button>
        )}
        <button className="relative px-3 py-2 border border-stone-200 rounded-lg hover:bg-stone-50">
          <Icon name="bell" className="w-4 h-4 text-stone-700" />
        </button>
      </div>
    </div>
  )
}
