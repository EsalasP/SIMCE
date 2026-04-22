import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/db'
import { formatFecha } from '@/lib/utils'

export function SeleccionEnsayoResultados() {
  const ensayos = useLiveQuery(() => db.ensayos.orderBy('fecha').reverse().toArray())
  const cursos = useLiveQuery(() => db.cursos.toArray())
  const cursoMap = Object.fromEntries((cursos ?? []).map((c) => [c.id!, c.nombre]))
  const loading = ensayos === undefined

  return (
    <div>
      <Topbar title="Resultados" subtitle="Selecciona un ensayo para ver el dashboard" />
      <div className="p-6 max-w-3xl">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : ensayos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No hay ensayos aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ensayos.map((e) => (
              <Link key={e.id} to={`/resultados/${e.id}`}>
                <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3">
                      <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{e.nombre}</p>
                        <Badge variant="secondary">{e.nivel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cursoMap[e.cursoId] ?? '—'} · {formatFecha(e.fecha)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
