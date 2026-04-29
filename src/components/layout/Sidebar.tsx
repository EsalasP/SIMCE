import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  PenLine,
  BarChart3,
  TrendingUp,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useConfigStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { label: 'Inicio', path: '/', icon: LayoutDashboard },
  { label: 'Cursos', path: '/cursos', icon: Users },
  { label: 'Ensayos', path: '/ensayos', icon: BookOpen },
  { label: 'Corrección', path: '/correccion', icon: PenLine },
  { label: 'Resultados', path: '/resultados', icon: BarChart3 },
  { label: 'Comparar', path: '/comparar', icon: TrendingUp },
  { label: 'Exportar', path: '/exportar', icon: Download },
  { label: 'Configuración', path: '/configuracion', icon: Settings },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { config } = useConfigStore()
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col border-r bg-card h-screen sticky top-0 overflow-hidden shrink-0"
    >
      {/* Logo / nombre */}
      <div className="flex items-center gap-3 px-4 h-14 border-b shrink-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
          style={{ backgroundColor: config.colorPrimario }}
        >
          <GraduationCap className="h-4 w-4" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-xs font-semibold truncate leading-tight">
                {config.nombreColegio}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">SIMCE</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive =
            path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

          const link = (
            <NavLink
              to={path}
              key={path}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                sidebarCollapsed && 'justify-center',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          }
          return link
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.aside>
  )
}
