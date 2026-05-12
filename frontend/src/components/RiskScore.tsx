interface RiskScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
}

export default function RiskScore({ score, size = 'md' }: RiskScoreProps) {
  const color =
    score >= 70 ? 'text-red-600' : score >= 40 ? 'text-amber-700' : 'text-emerald-600'
  return <span className={`${color} ${SIZES[size]} font-bold font-mono`}>{score}</span>
}
