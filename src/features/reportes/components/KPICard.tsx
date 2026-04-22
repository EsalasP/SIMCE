import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-primary/10', text: 'text-primary' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
}

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'default' | 'emerald' | 'amber' | 'red'
}

export function KPICard({ label, value, sub, color = 'default' }: KPICardProps) {
  const { bg, text } = COLOR_MAP[color]
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn('inline-flex rounded-lg px-3 py-1.5 mb-2', bg)}>
          <span className={cn('text-2xl font-bold', text)}>{value}</span>
        </div>
        <p className="text-sm font-medium leading-tight">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
