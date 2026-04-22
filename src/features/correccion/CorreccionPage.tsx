import { useParams, Link } from 'react-router-dom'
import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ClipboardPaste, Save, BarChart3 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  useEnsayo,
  useCurso,
  useEstudiantesByCurso,
  usePreguntasByEnsayo,
  useRespuestasByEnsayo,
  bulkUpsertRespuestas,
} from '@/db'
import { cn, parsePasteData, normalizarRespuesta, formatFecha } from '@/lib/utils'
import type { Pregunta, Respuesta } from '@/types'

const ALTERNATIVAS: Respuesta[] = ['A', 'B', 'C', 'D', 'omitida']

// Valor local: letra para alternativa, número para desarrollo
type EntradaLocal = Respuesta | number

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e']

// ─── Colores ──────────────────────────────────────────────────────────────────

function altCellColor(resp: Respuesta | null, isCorrect: boolean): string {
  if (!resp) return 'border-border hover:bg-accent/50'
  if (resp === 'omitida') return 'bg-muted text-muted-foreground border-border'
  return isCorrect
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
    : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-200 dark:border-red-700'
}

function desCellColor(score: number, max: number): string {
  if (score === 0) return 'border-border hover:bg-accent/50 text-muted-foreground'
  if (score >= max) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-700'
}

function pctColorClass(pct: number): string {
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function saveButtonLabel(saving: boolean, saved: boolean, pendingCount: number): string {
  if (saving) return 'Guardando…'
  if (saved) return '¡Guardado!'
  if (pendingCount > 0) return `Guardar (${pendingCount})`
  return 'Guardar'
}

// ─── Cabecera de columna ──────────────────────────────────────────────────────

function ColHeader({ p }: { p: Pregunta }) {
  if (p.tipoPregunta === 'desarrollo') {
    return (
      <>
        <div className="text-violet-600 dark:text-violet-400">{p.numero}</div>
        <div className="text-[9px] font-normal text-violet-500 dark:text-violet-500">
          /{p.puntajeMaximo ?? 2}
        </div>
      </>
    )
  }
  return (
    <>
      <div>{p.numero}</div>
      <div className="text-[9px] font-normal text-muted-foreground opacity-70">
        {p.respuestaCorrecta}
      </div>
    </>
  )
}

// ─── Celda de corrección ──────────────────────────────────────────────────────

function CeldaAlternativa({
  resp,
  clave,
  onClick,
  titulo,
}: {
  resp: Respuesta | null
  clave: Respuesta
  onClick: () => void
  titulo: string
}) {
  return (
    <button
      className={cn(
        'w-full h-7 rounded border text-center font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-xs',
        altCellColor(resp, resp === clave),
      )}
      onClick={onClick}
      title={titulo}
    >
      {resp === 'omitida' ? '—' : (resp ?? '')}
    </button>
  )
}

function CeldaDesarrollo({
  score,
  max,
  onClick,
  titulo,
}: {
  score: number
  max: number
  onClick: () => void
  titulo: string
}) {
  return (
    <button
      className={cn(
        'w-full h-7 rounded border text-center font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-xs',
        desCellColor(score, max),
      )}
      onClick={onClick}
      title={titulo}
    >
      {score}/{max}
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CorreccionPage() {
  const { ensayoId } = useParams<{ ensayoId: string }>()

  const ensayo = useEnsayo(ensayoId)
  const curso = useCurso(ensayo?.cursoId)
  const estudiantes = useEstudiantesByCurso(ensayo?.cursoId)
  const preguntas = usePreguntasByEnsayo(ensayoId)
  const respuestasDB = useRespuestasByEnsayo(ensayoId)

  // Map<`${estudianteId}-${numPregunta}`, Respuesta | number>
  const [localChanges, setLocalChanges] = useState<Map<string, EntradaLocal>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getEntrada = useCallback(
    (estudianteId: string, numPregunta: number): EntradaLocal | null => {
      const key = `${estudianteId}-${numPregunta}`
      const cached = localChanges.get(key)
      if (cached !== undefined) return cached
      const fromDB = respuestasDB?.find(
        (r) => r.estudianteId === estudianteId && r.numeroPregunta === numPregunta,
      )
      if (!fromDB) return null
      const pregunta = preguntas?.find((p) => p.numero === numPregunta)
      if (pregunta?.tipoPregunta === 'desarrollo') return fromDB.puntaje ?? 0
      return fromDB.respuesta
    },
    [localChanges, respuestasDB, preguntas],
  )

  const setEntrada = (estudianteId: string, numPregunta: number, valor: EntradaLocal) => {
    setLocalChanges((prev) => new Map(prev).set(`${estudianteId}-${numPregunta}`, valor))
    setSaved(false)
  }

  const ciclarAlternativa = (estudianteId: string, numPregunta: number) => {
    const current = getEntrada(estudianteId, numPregunta)
    const resp = typeof current === 'string' ? current : null
    const idx = resp ? ALTERNATIVAS.indexOf(resp) : -1
    setEntrada(estudianteId, numPregunta, ALTERNATIVAS[(idx + 1) % ALTERNATIVAS.length])
  }

  const ciclarDesarrollo = (estudianteId: string, numPregunta: number, max: number) => {
    const current = getEntrada(estudianteId, numPregunta)
    const score = typeof current === 'number' ? current : 0
    setEntrada(estudianteId, numPregunta, (score + 1) % (max + 1))
  }

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
          if (pregunta.tipoPregunta === 'desarrollo') {
            const score = Number.parseInt(cell.trim())
            const max = pregunta.puntajeMaximo ?? 2
            if (!Number.isNaN(score)) changes.set(`${est.id}-${pregunta.numero}`, Math.max(0, Math.min(score, max)))
          } else {
            const resp = normalizarRespuesta(cell)
            if (resp) changes.set(`${est.id}-${pregunta.numero}`, resp)
          }
        })
      })
      setLocalChanges(changes)
      setSaved(false)
    },
    [estudiantes, preguntas, localChanges],
  )

  const handleSave = async () => {
    if (!preguntas || !ensayoId) return
    setSaving(true)
    const toSave = Array.from(localChanges.entries()).map(([key, entrada]) => {
      const dashIdx = key.lastIndexOf('-')
      const estudianteId = key.slice(0, dashIdx)
      const numeroPregunta = Number.parseInt(key.slice(dashIdx + 1))
      if (typeof entrada === 'number') {
        return { ensayoId, estudianteId, numeroPregunta, respuesta: 'omitida' as Respuesta, puntaje: entrada }
      }
      return { ensayoId, estudianteId, numeroPregunta, respuesta: entrada }
    })
    await bulkUpsertRespuestas(toSave)
    setLocalChanges(new Map())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const loading = !ensayo || !estudiantes || !preguntas || !respuestasDB

  if (!loading && ensayo === null) {
    return <div className="p-8 text-center text-muted-foreground">Ensayo no encontrado.</div>
  }

  const pendingCount = localChanges.size

  function calcPct(estId: string): number | null {
    if (!preguntas) return null
    let puntajeObtenido = 0
    let puntajeTotal = 0
    let respondidas = 0
    for (const p of preguntas) {
      const entrada = getEntrada(estId, p.numero)
      if (entrada === null) continue
      respondidas++
      const esDesarrollo = p.tipoPregunta === 'desarrollo'
      const max = esDesarrollo ? (p.puntajeMaximo ?? 2) : 1
      puntajeTotal += max
      if (typeof entrada === 'number') {
        puntajeObtenido += Math.min(entrada, max)
      } else if (entrada !== 'omitida' && entrada === p.respuestaCorrecta) {
        puntajeObtenido += 1
      }
    }
    if (respondidas === 0) return null
    return Math.round((puntajeObtenido / (puntajeTotal || 1)) * 100)
  }

  function renderBody() {
    if (loading) {
      return (
        <div className="space-y-2">
          {SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-10" />)}
        </div>
      )
    }
    if (estudiantes.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Este curso no tiene estudiantes.{' '}
          <Link to={`/cursos/${ensayo?.cursoId}`} className="text-primary underline">
            Agregar estudiantes
          </Link>
        </div>
      )
    }
    return (
      <div
        ref={containerRef}
        onPaste={handlePaste}
        role="grid"
        aria-label="Tabla de respuestas"
        className="overflow-auto rounded-lg border bg-card focus:outline-none"
        tabIndex={0}
      >
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 bg-muted/80 backdrop-blur-sm text-left px-3 py-2 font-semibold min-w-[180px] z-10">
                Estudiante
              </th>
              {preguntas.map((p) => (
                <th key={p.numero} className="px-1.5 py-2 font-semibold text-center min-w-[2.5rem]">
                  <ColHeader p={p} />
                </th>
              ))}
              <th className="px-3 py-2 font-semibold text-center min-w-[3rem]">%</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est, estIdx) => {
              const estId = est.id ?? ''
              const pct = calcPct(estId)

              return (
                <tr key={est.id} className={cn('border-b last:border-0', estIdx % 2 === 0 ? '' : 'bg-muted/20')}>
                  <td className="sticky left-0 bg-card backdrop-blur-sm px-3 py-1.5 font-medium z-10 border-r">
                    <span className="mr-2 text-muted-foreground">{estIdx + 1}</span>
                    {est.nombre}
                  </td>
                  {preguntas.map((p) => {
                    const max = p.puntajeMaximo ?? 2
                    if (p.tipoPregunta === 'desarrollo') {
                      const entrada = getEntrada(estId, p.numero)
                      const score = typeof entrada === 'number' ? entrada : 0
                      return (
                        <td key={p.numero} className="p-0.5">
                          <CeldaDesarrollo
                            score={score}
                            max={max}
                            onClick={() => ciclarDesarrollo(estId, p.numero, max)}
                            titulo={`P${p.numero}: ${score}/${max} pts`}
                          />
                        </td>
                      )
                    }
                    const entrada = getEntrada(estId, p.numero)
                    const resp = typeof entrada === 'string' ? entrada as Respuesta : null
                    return (
                      <td key={p.numero} className="p-0.5">
                        <CeldaAlternativa
                          resp={resp}
                          clave={p.respuestaCorrecta}
                          onClick={() => ciclarAlternativa(estId, p.numero)}
                          titulo={`P${p.numero}: ${resp ?? 'sin respuesta'}`}
                        />
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5 text-center font-semibold">
                    {pct === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={cn('text-xs', pctColorClass(pct))}>
                        {pct}%
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

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
              {saveButtonLabel(saving, saved, pendingCount)}
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Button variant="ghost" size="sm" className="gap-1 -ml-1 mb-4" asChild>
          <Link to="/ensayos"><ArrowLeft className="h-4 w-4" /> Ensayos</Link>
        </Button>

        <Card className="mb-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-3 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
            <ClipboardPaste className="h-4 w-4 shrink-0" />
            <span>
              <strong>Pegado masivo:</strong> Copia desde Excel/Sheets (filas = estudiantes, columnas = preguntas) y pega con{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 font-mono text-[10px]">⌘V</kbd>.
              Alternativas: A/B/C/D. Desarrollo: ingresa el número de puntos (ej. 0, 1, 2).
            </span>
          </CardContent>
        </Card>

        {renderBody()}
      </div>
    </div>
  )
}
