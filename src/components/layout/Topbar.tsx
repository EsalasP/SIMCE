import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/types'

const THEMES: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Oscuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
]

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { theme, setTheme } = useTheme()

  const next = THEMES[(THEMES.findIndex((t) => t.value === theme) + 1) % THEMES.length]
  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2]
  const Icon = current.icon

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(next.value)}
          aria-label={`Cambiar a modo ${next.label}`}
          title={`Modo ${current.label} — clic para ${next.label}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
