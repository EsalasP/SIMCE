import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, Link } from 'react-router-dom'
import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ClipboardPaste, Save, BarChart3 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { db, bulkUpsertRespuestas } from '@/db'
import { cn, parsePasteData, normalizarRespuesta, formatFecha } from '@/lib/utils'
import type { Respuesta } from '@/types'

const ALTERNATIVAS: Respuesta[] = ['A', 'B', 'C', 'D', 'omitida']

const CELL_COLORS: Record<string, string> = {
  correct: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700',
  incorrect: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-200 dark:border-red-700',
  omitted: 'bg-muted text-muted-foreground border-border',
  empty: 'border-border hover:bg-accent/50',
}

export function CorreccionPage() {
  const { ensayoId: paramId } = useParams<{ ensayoId: string }>()
  const ensayoId = parseInt(paramId ?? '0')

  const ensayo = useLiveQuery(() => db.ensayos.get(ensayoId), [ensayoId])
  const curso = useLiveQuery(
    () => ensayo ? db.cursos.get(ensayo.cursoId) : undefined,
    [ensayo],
  )
  const estudiantes = useLiveQuery(
    () => ensayo ? db.estudiantes.where('cursoId').equals(ensayo.cursoId).sortBy('nombre') : [],
    [ensayo],
  )
  const preguntas = useLiveQuery(
    () => db.preguntas.where('ensayoId').equals(ensayoId).sortBy('numero'),
    [ensayoId],
  )
  const respuestasDB = useLiveQuery(
    () => db.respuestas.where('ensayoId').equals(ensayoId).toArray(),
    [ensayoId],
  )

  // Estado local: Map<`${estudianteId}-${numeroPregunta}`, Respuesta>
  const [localChanges, setLocalChanges] = useState<Map<string, Respuesta>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getRespuesta = useCallback(
    (estudianteId: number, numPregunta: number): Respuesta | null => {
      const key = `${estudianteId}-${numPregunta}`
      if (localChanges.has(key)) return localChanges.get(key)!
      const fromDB = respuestasDB?.find(
        (r) => r.estudianteId === estudianteId && r.numeroPregunta === numPregunta,
      )
      return fromDB?.respuesta ?? null
    },
    [localChanges, respuestasDB],
  )

  const setRespuesta = (estudianteId: number, numPregunta: number, resp: Respuesta) => {
    setLocalChanges((prev) => new Map(prev).set(`${estudianteId}-${numPregunta}`, resp))
    setSaved(false)
  }

  const ciclarRespuesta = (estudianteId: number, numPregunta: number) => {
    const current = getRespuesta(estudianteId, numPregunta)
    const idx = current ? ALTERNATIVAS.indexOf(current) : -1
    const next = ALTERNATIVAS[(idx + 1) % ALTERNATIVAS.length]
    setRespuesta(estudianteId, numPregunta, next)
  }

  // Pegado masivo desde Excel/Sheets
  // Formato esperado: estudiantes en filas, preguntas en columnas
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      const rows = parsePasteData(text)
      if (!estudiantes || !preguntas) return

      const changes = new Map(localChanges)
      rows.forEach((row, rowIdx) => {
        const est = estudiantes[rowIdx]
        if (!est?.id) return
        row.forEach((cell, colIdx) => {
          const pregunta = preguntas[colIdx]
          if (!pregunta) return
          const resp = normalizarRespuesta(cell)
          if (resp) changes.set(`${est.id}-${pregunta.numero}`, resp)
        })
      })
      setLocalChanges(changes)
      setSaved(false)
    },
    [estudiantes, preguntas, localChanges],
  )

  const handleSave = async () => {
    if (!preguntas || !estudiantes) return
    setSaving(true)
    const toSave = Array.from(localChanges.entries()).map(([key, respuesta]) => {
      const [estudianteId, numeroPregunta] = key.split('-').map(Number)
      return { ensayoId, estudianteId, numeroPregunta, respuesta }
    })
    await bulkUpsertRespuestas(toSave)
    setLocalChanges(new Map())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const loading = !ensayo || !estudiantes || !preguntas || !respuestasDB

  if (!loading && !ensayo) {
    return <div className="p-8 text-center text-muted-foreground">Ensayo no encontrado.</div>
  }

  const pendingCount = localChanges.size

  return (
    <div>
      <Topbar
        title={ensayo?.nombre ?? '…'}
        subtitle={ensayo ? `${curso?.nombre ?? ''} · ${formatFecha(ensayo.fecha)}` : ''}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/resultados/${ensayoId}`}>
                <BarChart3 className="h-4 w-4" /> Ver resultados
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={pendingCount === 0 || saving}
              className={cn(saved && 'bg-emerald-600 hover:bg-emerald-700')}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : saved ? '¡Guardado!' : `Guardar${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Button variant="ghost" size="sm" className="gap-1 -ml-1 mb-4" asChild>
          <Link to="/ensayos"><ArrowLeft className="h-4 w-4" /> Ensayos</Link>
        </Button>

        {/* Instrucciones de pegado */}
        <Card className="mb-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-3 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
            <ClipboardPaste className="h-4 w-4 shrink-0" />
            <span>
              <strong>Pegado masivo:</strong> Copia desde Excel/Google Sheets (filas = estudiantes, columnas = preguntas) y pega con{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 font-mono text-[10px]">⌘V</kbd> en la tabla.
              También puedes hacer clic en cada celda para ciclar entre A/B/C/D/Omitida.
            </span>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Este curso no tiene estudiantes. <Link to={`/cursos/${ensayo?.cursoId}`} className="text-primary underline">Agregar estudiantes</Link>
          </div>
        ) : (
          <div
            ref={containerRef}
            onPaste={handlePaste}
            className="overflow-auto rounded-lg border bg-card"
            tabIndex={0}
          >
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 bg-muted/80 backdrop-blur-sm text-left px-3 py-2 font-semibold min-w-[180px] z-10">
                    Estudiante
                  </th>
                  {preguntas.map((p) => (
                    <th key={p.numero} className="px-1.5 py-2 font-semibold text-center min-w-[2rem]">
                      <div>{p.numero}</div>
                      <div className="text-[9px] font-normal text-muted-foreground opacity-70">
                        {p.respuestaCorrecta}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold text-center min-w-[3rem]">%</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est, estIdx) => {
                  const resps = preguntas.map((p) => getRespuesta(est.id!, p.numero))
                  const correctas = preguntas.filter((p, i) => resps[i] === p.respuestaCorrecta).length
                  const totalRespondidas = resps.filter((r) => r !== null).length
                  const pct = totalRespondidas > 0 ? Math.round((correctas / preguntas.length) * 100) : null

                  return (
                    <tr key={est.id} className={cn('border-b last:border-0', estIdx % 2 === 0 ? '' : 'bg-muted/20')}>
                      <td className="sticky left-0 bg-card backdrop-blur-sm px-3 py-1.5 font-medium z-10 border-r">
                        <span className="mr-2 text-muted-foreground">{estIdx + 1}</span>
                        {est.nombre}
                      </td>
                      {preguntas.map((p) => {
                        const resp = getRespuesta(est.id!, p.numero)
                        const isCorrect = resp === p.respuestaCorrecta
                        const colorClass = !resp
                          ? CELL_COLORS.empty
                          : resp === 'omitida'
                            ? CELL_COLORS.omitted
                            : isCorrect
                              ? CELL_COLORS.correct
                              : CELL_COLORS.incorrect

                        return (
                          <td key={p.numero} className="p-0.5">
                            <button
                              className={cn(
                                'w-full h-7 rounded border text-center font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
                                colorClass,
                              )}
                              onClick={() => ciclarRespuesta(est.id!, p.numero)}
                              title={`P${p.numero}: ${resp ?? 'sin respuesta'}`}
                            >
                              {resp === 'omitida' ? '—' : (resp ?? '')}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-2 py-1.5 text-center font-semibold">
                        {pct !== null ? (
                          <span
                            className={cn(
                              'text-xs',
                              pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600',
                            )}
                          >
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
