import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ChevronRight, ChevronLeft, BookOpen, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { db, addEnsayo, setPreguntasEnsayo } from '@/db'
import type { Nivel, Asignatura, Eje, Habilidad, Respuesta } from '@/types'
import { EJES, EJES_LECTURA } from '@/lib/calculos'
import { cn } from '@/lib/utils'

const NIVELES: Nivel[] = ['4°', '6°', '8°', 'II°']
const ASIGNATURAS: Asignatura[] = ['Matemática', 'Lectura']

const HABILIDADES_MATEMATICA: Habilidad[] = ['Resolver problemas', 'Representar', 'Modelar', 'Argumentar y comunicar']
const HABILIDADES_LECTURA: Habilidad[] = ['Localizar', 'Interpretar', 'Reflexionar y evaluar', 'Vocabulario']
const ALTERNATIVAS = ['A', 'B', 'C', 'D'] as const

interface PreguntaConfig {
  numero: number
  respuestaCorrecta: Exclude<Respuesta, 'omitida'>
  eje: Eje
  habilidad: Habilidad
  oa: string
}

const STEPS = ['Datos del ensayo', 'Clave de respuestas', 'Eje y habilidad']

function defaultPregunta(i: number, asignatura: Asignatura): PreguntaConfig {
  return {
    numero: i + 1,
    respuestaCorrecta: 'A',
    eje: asignatura === 'Matemática' ? 'Números y Operaciones' : 'Comprensión lectora',
    habilidad: asignatura === 'Matemática' ? 'Resolver problemas' : 'Localizar',
    oa: '',
  }
}

export function NuevoEnsayoWizard() {
  const navigate = useNavigate()
  const cursos = useLiveQuery(() =>
    db.cursos.toArray().then((arr) => arr.sort((a, b) => a.nombre.localeCompare(b.nombre))),
  )

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Paso 1
  const [nombre, setNombre] = useState('')
  const [nivel, setNivel] = useState<Nivel>('4°')
  const [asignatura, setAsignatura] = useState<Asignatura>('Matemática')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [numPreguntas, setNumPreguntas] = useState(30)
  const [cursoId, setCursoId] = useState<number | null>(null)

  // Pasos 2 y 3
  const [preguntas, setPreguntas] = useState<PreguntaConfig[]>(() =>
    Array.from({ length: 30 }, (_, i) => defaultPregunta(i, 'Matemática')),
  )

  const handleAsignaturaChange = (v: Asignatura) => {
    setAsignatura(v)
    setPreguntas((prev) => prev.map((p, i) => ({ ...defaultPregunta(i, v), numero: p.numero, respuestaCorrecta: p.respuestaCorrecta, oa: p.oa })))
  }

  const updateNumPreguntas = (n: number) => {
    setNumPreguntas(n)
    setPreguntas((prev) => {
      const next = [...prev]
      if (n > prev.length) {
        for (let i = prev.length; i < n; i++) {
          next.push(defaultPregunta(i, asignatura))
        }
      } else {
        next.length = n
      }
      return next
    })
  }

  const setPreguntaField = <K extends keyof PreguntaConfig>(
    idx: number,
    field: K,
    value: PreguntaConfig[K],
  ) => {
    setPreguntas((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const applyEjeToAll = (eje: Eje) =>
    setPreguntas((prev) => prev.map((p) => ({ ...p, eje })))

  const ejesActuales = asignatura === 'Matemática' ? EJES : EJES_LECTURA
  const habilidadesActuales = asignatura === 'Matemática' ? HABILIDADES_MATEMATICA : HABILIDADES_LECTURA

  const step1Valid = nombre.trim() && cursoId !== null
  const step2Valid = preguntas.every((p) => p.respuestaCorrecta)
  const step3Valid = preguntas.every((p) => p.eje)

  const handleFinish = async () => {
    if (!cursoId) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const id = await addEnsayo({
        nombre: nombre.trim(),
        nivel,
        asignatura,
        fecha: new Date(fecha + 'T12:00:00'),
        numPreguntas,
        cursoId,
        creadoEn: new Date(),
      })
      const ensayoId = Number(id)
      await setPreguntasEnsayo(
        ensayoId,
        preguntas.map((p) => ({ ...p, ensayoId })),
      )
      navigate(`/correccion/${ensayoId}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar el ensayo. Intenta nuevamente.')
      setSaving(false)
    }
  }

  return (
    <div>
      <Topbar title="Nuevo ensayo" subtitle="Configura el ensayo en 3 pasos" />

      <div className="p-6 max-w-3xl">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-0 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                        ? 'border-2 border-primary text-primary'
                        : 'border-2 border-muted text-muted-foreground',
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm hidden sm:block',
                    i === step ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px mx-3', i < step ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre del ensayo *</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej: Ensayo 1 SIMCE Matemática 4°B"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Curso *</Label>
                      <Select
                        value={cursoId?.toString() ?? ''}
                        onValueChange={(v) => setCursoId(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso…" />
                        </SelectTrigger>
                        <SelectContent>
                          {(cursos ?? []).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Asignatura *</Label>
                      <Select value={asignatura} onValueChange={(v) => handleAsignaturaChange(v as Asignatura)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ASIGNATURAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nivel</Label>
                      <Select value={nivel} onValueChange={(v) => setNivel(v as Nivel)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NIVELES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="numPreguntas">N° de preguntas</Label>
                    <Input
                      id="numPreguntas"
                      type="number"
                      min={5}
                      max={80}
                      value={numPreguntas}
                      onChange={(e) => updateNumPreguntas(parseInt(e.target.value) || 30)}
                      className="w-32"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Indica la alternativa correcta para cada pregunta.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {preguntas.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6 text-right">{p.numero}</span>
                        <div className="flex gap-0.5">
                          {ALTERNATIVAS.map((alt) => (
                            <button
                              key={alt}
                              onClick={() => setPreguntaField(i, 'respuestaCorrecta', alt)}
                              className={cn(
                                'w-7 h-7 text-xs font-semibold rounded transition-colors border',
                                p.respuestaCorrecta === alt
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border hover:bg-accent',
                              )}
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Aplicar eje a todas:</span>
                      {ejesActuales.map((eje) => (
                        <button
                          key={eje}
                          onClick={() => applyEjeToAll(eje)}
                          className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                        >
                          {eje.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {preguntas.map((p, i) => (
                      <div key={i} className="grid grid-cols-[2rem_1fr_1fr_8rem] gap-2 items-center">
                        <span className="text-xs text-muted-foreground text-right">{p.numero}</span>
                        <Select
                          value={p.eje}
                          onValueChange={(v) => setPreguntaField(i, 'eje', v as Eje)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ejesActuales.map((e) => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select
                          value={p.habilidad}
                          onValueChange={(v) => setPreguntaField(i, 'habilidad', v as Habilidad)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {habilidadesActuales.map((h) => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="OA (ej: LE04)"
                          className="h-8 text-xs"
                          value={p.oa}
                          onChange={(e) => setPreguntaField(i, 'oa', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={cn('h-1.5 w-8 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-border')} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 ? !step1Valid : !step2Valid}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!step3Valid || saving}>
              {saving ? 'Creando…' : 'Crear ensayo'}
              <BookOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
