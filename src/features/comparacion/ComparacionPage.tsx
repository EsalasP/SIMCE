import { useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import { useCursos, useEnsayos, getEstudiantesByCurso, getPreguntasByEnsayo, getRespuestasByEnsayo, getAusenciasByEnsayo } from '@/db'
import { calcularResumenCurso, puntajeSimce } from '@/lib/calculos'
import { formatFecha, bgNivel, cn } from '@/lib/utils'
import type { ResumenCurso, Ensayo } from '@/types'
import { useConfigStore } from '@/store'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface ResumenConEnsayo {
  ensayo: Ensayo
  resumen: ResumenCurso
}

export function ComparacionPage() {
  const { umbrales } = useConfigStore()
  const cursos = useCursos()
  const ensayos = useEnsayos()

  const [cursoId, setCursoId] = useState<string>('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [resultados, setResultados] = useState<ResumenConEnsayo[]>([])
  const [loading, setLoading] = useState(false)

  const ensayosCurso = ensayos?.filter((e) => e.cursoId === cursoId) ?? []

  const toggleEnsayo = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 5) next.add(id)
      return next
    })
  }

  const handleComparar = useCallback(async () => {
    if (!cursoId || seleccionados.size < 2) return
    setLoading(true)

    const ensayosSeleccionados = ensayosCurso
      .filter((e) => seleccionados.has(e.id ?? ''))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

    const estudiantes = await getEstudiantesByCurso(cursoId)
    const resultadosList: ResumenConEnsayo[] = []
    for (const ensayo of ensayosSeleccionados) {
      const eid = ensayo.id ?? ''
      const [preguntas, respuestas, ausentes] = await Promise.all([
        getPreguntasByEnsayo(eid),
        getRespuestasByEnsayo(eid),
        getAusenciasByEnsayo(eid),
      ])
      const resumen = calcularResumenCurso(eid, estudiantes, preguntas, respuestas, umbrales, ausentes)
      resultadosList.push({ ensayo, resumen })
    }

    setResultados(resultadosList)
    setLoading(false)
  }, [cursoId, seleccionados, ensayosCurso, umbrales])

  // ── datos para gráfico de progresión global ──────────────────────────────────
  const lineData = resultados.map(({ ensayo, resumen }) => ({
    fecha: formatFecha(ensayo.fecha),
    nombre: ensayo.nombre,
    '% Logro': resumen.promedio,
    'Pts SIMCE': puntajeSimce(resumen.promedio),
    Adecuado: resumen.porcentajeAdecuado,
    Elemental: resumen.porcentajeElemental,
    Insuficiente: resumen.porcentajeInsuficiente,
  }))

  // ── mapa de resultados por estudiante ─────────────────────────────────────────
  const estudianteMap = new Map<string, { nombre: string; pcts: (number | null)[] }>()
  resultados.forEach(({ resumen }, idx) => {
    for (const re of resumen.resultadosEstudiantes) {
      if (!estudianteMap.has(re.estudianteId)) {
        estudianteMap.set(re.estudianteId, {
          nombre: re.nombre,
          pcts: Array(resultados.length).fill(null),
        })
      }
      const entry = estudianteMap.get(re.estudianteId)
      if (entry) entry.pcts[idx] = re.porcentaje
    }
  })
  const estudiantesTabla = [...estudianteMap.values()].sort((a, b) => {
    const aLast = a.pcts.findLast((p) => p !== null) ?? -1
    const bLast = b.pcts.findLast((p) => p !== null) ?? -1
    return bLast - aLast
  })

  function tendencia(pcts: (number | null)[]): 'sube' | 'baja' | 'igual' | null {
    const vals = pcts.filter((p): p is number => p !== null)
    if (vals.length < 2) return null
    const diff = vals[vals.length - 1] - vals[0]
    if (diff > 3) return 'sube'
    if (diff < -3) return 'baja'
    return 'igual'
  }

  return (
    <div>
      <Topbar title="Comparar ensayos" subtitle="Progresión global y por estudiante" />

      <div className="p-6 space-y-6 max-w-6xl">
        {/* Selector */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 min-w-[200px]">
                <label className="text-xs font-semibold text-muted-foreground">Curso</label>
                <Select value={cursoId} onValueChange={(v) => { setCursoId(v); setSeleccionados(new Set()); setResultados([]) }}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Seleccionar curso…" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos?.map((c) => (
                      <SelectItem key={c.id} value={c.id ?? ''}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={seleccionados.size < 2 || loading}
                onClick={handleComparar}
              >
                {loading ? 'Cargando…' : 'Comparar'}
              </Button>
            </div>

            {cursoId && ensayosCurso.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Ensayos del curso <span className="text-foreground">(selecciona 2–5)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...ensayosCurso]
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
                    .map((e) => {
                      const id = e.id ?? ''
                      const selected = seleccionados.has(id)
                      return (
                        <button
                          key={id}
                          onClick={() => toggleEnsayo(id)}
                          className={cn(
                            'px-3 py-1.5 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:bg-accent',
                          )}
                        >
                          {e.nombre} · {formatFecha(e.fecha)}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {cursoId && ensayosCurso.length === 0 && (
              <p className="text-sm text-muted-foreground">Este curso no tiene ensayos registrados.</p>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {!loading && resultados.length >= 2 && (
          <>
            {/* Gráfico promedio global */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Progresión del promedio del curso</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lineData} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="pct" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
                    <YAxis yAxisId="simce" orientation="right" domain={[100, 400]} tick={{ fontSize: 11 }} width={40} />
                    <Tooltip
                      formatter={(v, name) => name === 'Pts SIMCE' ? [`${v} pts`, name] : [`${v}%`, name]}
                      labelFormatter={(l, payload) => payload[0]?.payload?.nombre ?? l}
                    />
                    <Legend />
                    <Line yAxisId="pct" type="monotone" dataKey="% Logro" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    <Line yAxisId="simce" type="monotone" dataKey="Pts SIMCE" stroke={COLORS[2]} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico distribución de niveles */}
            <div className="grid sm:grid-cols-2 gap-4">
              {resultados.map(({ ensayo, resumen }, i) => (
                <Card key={ensayo.id}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground">{formatFecha(ensayo.fecha)}</CardTitle>
                    <p className="text-sm font-semibold">{ensayo.nombre}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: COLORS[i] }}>{resumen.promedio}%</span>
                      <span className="text-sm text-muted-foreground">· {puntajeSimce(resumen.promedio)} pts SIMCE</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
                      {resumen.porcentajeAdecuado > 0 && (
                        <div className="bg-emerald-500 transition-all" style={{ width: `${resumen.porcentajeAdecuado}%` }} title={`Adecuado ${resumen.porcentajeAdecuado}%`} />
                      )}
                      {resumen.porcentajeElemental > 0 && (
                        <div className="bg-amber-400 transition-all" style={{ width: `${resumen.porcentajeElemental}%` }} title={`Elemental ${resumen.porcentajeElemental}%`} />
                      )}
                      {resumen.porcentajeInsuficiente > 0 && (
                        <div className="bg-red-400 transition-all" style={{ width: `${resumen.porcentajeInsuficiente}%` }} title={`Insuficiente ${resumen.porcentajeInsuficiente}%`} />
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="text-emerald-600">● Adec. {resumen.porcentajeAdecuado}%</span>
                      <span className="text-amber-500">● Elem. {resumen.porcentajeElemental}%</span>
                      <span className="text-red-500">● Insuf. {resumen.porcentajeInsuficiente}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{resumen.totalEvaluados} evaluados</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabla por estudiante */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Progresión por estudiante</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold min-w-[160px]">Estudiante</th>
                        {resultados.map(({ ensayo }, i) => (
                          <th key={ensayo.id} className="text-center px-3 py-2 font-semibold min-w-[90px]">
                            <span style={{ color: COLORS[i] }}>●</span> {ensayo.nombre}
                          </th>
                        ))}
                        <th className="text-center px-3 py-2 font-semibold">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantesTabla.map((est, idx) => {
                        const tend = tendencia(est.pcts)
                        return (
                          <tr key={est.nombre} className={cn('border-b last:border-0', idx % 2 === 0 ? '' : 'bg-muted/20')}>
                            <td className="px-4 py-2 font-medium">{est.nombre}</td>
                            {est.pcts.map((pct, i) => (
                              <td key={i} className="px-3 py-2 text-center">
                                {pct === null ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : (
                                  <span className={cn(
                                    'font-semibold',
                                    pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600',
                                  )}>
                                    {pct}%
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center">
                              {tend === 'sube' && <Badge className={cn('text-[10px]', bgNivel('Adecuado'))}>↑ Sube</Badge>}
                              {tend === 'baja' && <Badge className={cn('text-[10px]', bgNivel('Insuficiente'))}>↓ Baja</Badge>}
                              {tend === 'igual' && <Badge variant="outline" className="text-[10px]">→ Estable</Badge>}
                              {tend === null && <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
