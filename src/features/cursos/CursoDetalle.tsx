import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Trash2, Upload, ArrowLeft, UserCheck } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useCurso, useEstudiantesByCurso, addEstudiante, addEstudiantesEnLote, deleteEstudiante } from '@/db'
import { parsePasteData } from '@/lib/utils'

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e']

export function CursoDetalle() {
  const { id } = useParams<{ id: string }>()

  const curso = useCurso(id)
  const estudiantes = useEstudiantesByCurso(id)

  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAdd = async () => {
    if (!nombre.trim() || !id) return
    setSaving(true)
    await addEstudiante({ cursoId: id, nombre: nombre.trim(), rut: rut.trim() || undefined, creadoEn: new Date() })
    setNombre('')
    setRut('')
    setSaving(false)
    setOpen(false)
  }

  const handleImport = async () => {
    if (!id) return
    const rows = parsePasteData(importText)
    const lista = rows
      .map((row) => row[0]?.trim())
      .filter(Boolean)
      .map((n) => ({ cursoId: id, nombre: n, creadoEn: new Date() }))
    if (lista.length === 0) return
    setSaving(true)
    await addEstudiantesEnLote(lista)
    setSaving(false)
    setImportText('')
    setImportOpen(false)
  }

  const loading = curso === undefined || estudiantes === undefined

  if (!loading && !curso) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Curso no encontrado.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/cursos">Volver a cursos</Link>
        </Button>
      </div>
    )
  }

  const importCount = parsePasteData(importText).filter((r) => r[0]?.trim()).length

  function renderEstudiantes() {
    if (loading) {
      return (
        <div className="p-4 space-y-2">
          {SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-10" />)}
        </div>
      )
    }
    if (estudiantes.length === 0) {
      return (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <UserCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sin estudiantes aún</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>Agregar uno a uno</Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              Importar lista
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="divide-y">
        {estudiantes.map((e, idx) => (
          <div key={e.id} className="flex items-center px-4 py-2.5 hover:bg-accent/50 group">
            <span className="text-xs text-muted-foreground w-8">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.nombre}</p>
              {e.rut && <p className="text-xs text-muted-foreground">{e.rut}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
              onClick={() => e.id && deleteEstudiante(e.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Topbar
        title={curso?.nombre ?? '…'}
        subtitle={curso ? `${curso.nivel} · ${curso.anio}` : ''}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Importar lista
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" className="gap-1 -ml-1 mb-2" asChild>
          <Link to="/cursos"><ArrowLeft className="h-4 w-4" /> Cursos</Link>
        </Button>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Estudiantes
              {!loading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {estudiantes.length} registrados
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderEstudiantes()}
          </CardContent>
        </Card>
      </div>

      {/* Modal agregar estudiante */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar estudiante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="est-nombre">Nombre completo</Label>
              <Input
                id="est-nombre"
                placeholder="Ej: María González López"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="est-rut">RUT (opcional)</Label>
              <Input
                id="est-rut"
                placeholder="12.345.678-9"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!nombre.trim() || saving}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal importar lista */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar lista de estudiantes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pega el listado desde Excel o Google Sheets. Un nombre por fila, en la primera columna.
            </p>
            <textarea
              ref={textareaRef}
              className="w-full h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={'María González López\nJuan Pérez Muñoz\nPedro Soto Ríos\n…'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Vista previa: {importCount} estudiantes detectados
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importCount === 0 || saving}>
              {saving ? 'Importando…' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
