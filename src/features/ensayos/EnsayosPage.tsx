import { Link } from 'react-router-dom'
import { Plus, BookOpen, Trash2, PenLine, BarChart3 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { useEnsayos, useCursos, deleteEnsayo } from '@/db'
import { formatFecha } from '@/lib/utils'
import type { Ensayo } from '@/types'

const SKELETON_KEYS = ['a', 'b', 'c', 'd']

export function EnsayosPage() {
  const ensayos = useEnsayos()
  const cursos = useCursos()
  const [deleteTarget, setDeleteTarget] = useState<Ensayo | null>(null)

  const cursoMap = Object.fromEntries((cursos ?? []).map((c) => [c.id ?? '', c.nombre]))
  const loading = ensayos === undefined

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    await deleteEnsayo(deleteTarget.id)
    setDeleteTarget(null)
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="space-y-3">
          {SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-24" />)}
        </div>
      )
    }
    if (ensayos.length === 0) {
      return <EmptyEnsayos />
    }
    return (
      <div className="space-y-3">
        {ensayos.map((e) => (
          <Card key={e.id} className="group hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{e.nombre}</p>
                  <Badge variant="secondary">{e.nivel}</Badge>
                  <Badge variant="outline">{e.asignatura}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cursoMap[e.cursoId] ?? 'Curso eliminado'} · {formatFecha(e.fecha)} · {e.numPreguntas} preguntas
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link to={`/correccion/${e.id}`} title="Ingresar respuestas">
                    <PenLine className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link to={`/resultados/${e.id}`} title="Ver resultados">
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
                  onClick={() => setDeleteTarget(e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Topbar
        title="Ensayos"
        subtitle="Gestiona los ensayos SIMCE"
        actions={
          <Button size="sm" asChild>
            <Link to="/ensayos/nuevo"><Plus className="h-4 w-4" /> Nuevo ensayo</Link>
          </Button>
        }
      />

      <div className="p-6 max-w-4xl">
        {renderContent()}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar ensayo</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{deleteTarget?.nombre}</strong>? Se perderán todas las respuestas ingresadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyEnsayos() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-sm mx-auto">
      <div className="rounded-full bg-muted p-5">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">No hay ensayos aún</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea un ensayo configurando la clave de respuestas y el eje de cada pregunta.
        </p>
      </div>
      <Button asChild>
        <Link to="/ensayos/nuevo"><Plus className="h-4 w-4" /> Crear primer ensayo</Link>
      </Button>
    </div>
  )
}
