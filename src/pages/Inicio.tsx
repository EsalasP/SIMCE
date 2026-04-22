import { Link } from 'react-router-dom'
import { BookOpen, Users, PenLine, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCursos, useEnsayos, useEstudiantesCountByCurso } from '@/db'
import { formatFecha } from '@/lib/utils'

const SKELETON_KEYS = ['a', 'b', 'c']

export function Inicio() {
  const cursos = useCursos()
  const ensayos = useEnsayos()
  const estudiantesCount = useEstudiantesCountByCurso()

  const loading = cursos === undefined

  const totalEstudiantes = estudiantesCount
    ? Object.values(estudiantesCount).reduce((a, b) => a + b, 0)
    : 0
  const recentEnsayos = (ensayos ?? []).slice(0, 5)

  return (
    <div>
      <Topbar title="Inicio" subtitle="Resumen general del colegio" />

      <div className="p-6 space-y-6 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Cursos',
              value: cursos?.length ?? 0,
              icon: Users,
              color: 'text-blue-600',
              bg: 'bg-blue-50 dark:bg-blue-950/30',
            },
            {
              label: 'Estudiantes',
              value: totalEstudiantes,
              icon: Users,
              color: 'text-violet-600',
              bg: 'bg-violet-50 dark:bg-violet-950/30',
            },
            {
              label: 'Ensayos',
              value: ensayos?.length ?? 0,
              icon: BookOpen,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            },
            {
              label: 'En corrección',
              value: 0,
              icon: PenLine,
              color: 'text-amber-600',
              bg: 'bg-amber-50 dark:bg-amber-950/30',
            },
          ].map(({ label, value, icon: Icon, color, bg }) =>
            loading ? (
              <Skeleton key={label} className="h-24 rounded-xl" />
            ) : (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`rounded-lg p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Ensayos recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-12" />)
              ) : recentEnsayos.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  message="Aún no hay ensayos creados"
                  action={<Button asChild size="sm"><Link to="/ensayos">Crear ensayo</Link></Button>}
                />
              ) : (
                recentEnsayos.map((e) => (
                  <Link
                    key={e.id}
                    to={`/resultados/${e.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatFecha(e.fecha)}</p>
                    </div>
                    <Badge variant="secondary">{e.nivel}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nuevo ensayo', icon: BookOpen, to: '/ensayos/nuevo', color: 'text-blue-600' },
                { label: 'Ingresar respuestas', icon: PenLine, to: '/correccion', color: 'text-violet-600' },
                { label: 'Ver resultados', icon: BarChart3, to: '/resultados', color: 'text-emerald-600' },
                { label: 'Gestionar cursos', icon: Users, to: '/cursos', color: 'text-amber-600' },
              ].map(({ label, icon: Icon, to, color }) => (
                <Button key={to} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <Link to={to}>
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className="text-xs">{label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {!loading && (cursos?.length ?? 0) === 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Comienza configurando tus cursos
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Para usar la aplicación, primero crea un curso y agrega estudiantes.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link to="/cursos">Ir a Cursos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
