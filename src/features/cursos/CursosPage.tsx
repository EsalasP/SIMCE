import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Users, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { db, addCurso, updateCurso, deleteCurso } from '@/db'
import type { Curso, Nivel } from '@/types'

const NIVELES: Nivel[] = ['4°', '6°', '8°', 'II°']

const NIVEL_COLOR: Record<Nivel, string> = {
  '4°': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  '6°': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  '8°': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'II°': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
}

export function CursosPage() {
  const cursos = useLiveQuery(() =>
    db.cursos.toArray().then((arr) => arr.sort((a, b) => a.nombre.localeCompare(b.nombre))),
  )
  const estudiantesCount = useLiveQuery(async () => {
    const all = await db.estudiantes.toArray()
    const map: Record<number, number> = {}
    for (const e of all) {
      if (e.cursoId) map[e.cursoId] = (map[e.cursoId] ?? 0) + 1
    }
    return map
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Curso | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Curso | null>(null)
  const [form, setForm] = useState({ nombre: '', nivel: '4°' as Nivel, anio: new Date().getFullYear() })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const openNew = () => {
    setEditing(null)
    setErrorMsg(null)
    setForm({ nombre: '', nivel: '4°', anio: new Date().getFullYear() })
    setOpen(true)
  }

  const openEdit = (c: Curso) => {
    setEditing(c)
    setErrorMsg(null)
    setForm({ nombre: c.nombre, nivel: c.nivel, anio: c.anio })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    setErrorMsg(null)
    try {
      if (editing?.id != null) {
        await updateCurso(editing.id, { nombre: form.nombre.trim(), nivel: form.nivel, anio: form.anio })
      } else {
        await addCurso({ nombre: form.nombre.trim(), nivel: form.nivel, anio: form.anio, creadoEn: new Date() })
      }
      setOpen(false)
    } catch (err) {
      console.error('Error al guardar curso:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteCurso(deleteTarget.id)
    } catch (err) {
      console.error('Error al eliminar curso:', err)
    }
    setDeleteTarget(null)
  }

  const loading = cursos === undefined

  return (
    <div>
      <Topbar
        title="Cursos"
        subtitle="Gestiona los cursos del colegio"
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nuevo curso
          </Button>
        }
      />

      <div className="p-6 max-w-4xl">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : cursos.length === 0 ? (
          <EmptyCursos onNew={openNew} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">{c.anio}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NIVEL_COLOR[c.nivel]}`}>
                      {c.nivel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {estudiantesCount?.[c.id!] ?? 0} estudiantes
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/cursos/${c.id}`}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setErrorMsg(null); setOpen(false) } }}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => {
            // Evita cerrar el dialog cuando el usuario hace clic en el dropdown del Select
            if ((e.target as Element)?.closest?.('[data-radix-popper-content-wrapper]')) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre del curso</Label>
              <Input
                id="nombre"
                placeholder="Ej: 4° A Básico"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nivel</Label>
                <Select value={form.nivel} onValueChange={(v) => setForm((f) => ({ ...f, nivel: v as Nivel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NIVELES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anio">Año</Label>
                <Input
                  id="anio"
                  type="number"
                  value={form.anio}
                  onChange={(e) => setForm((f) => ({ ...f, anio: parseInt(e.target.value) || f.anio }))}
                />
              </div>
            </div>
          </div>
          {errorMsg && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{errorMsg}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nombre.trim() || saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar eliminación */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar curso</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{deleteTarget?.nombre}</strong>? Se eliminarán también todos los
              estudiantes y ensayos asociados. Esta acción no se puede deshacer.
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

function EmptyCursos({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-sm mx-auto">
      <div className="rounded-full bg-muted p-5">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">No hay cursos aún</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primer curso para comenzar a gestionar estudiantes y ensayos.
        </p>
      </div>
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" /> Crear primer curso
      </Button>
    </div>
  )
}
