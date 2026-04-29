import { useParams, Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ArrowLeft, Download, Copy, CheckCheck } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEnsayo, useCurso, useEstudiantesByCurso, usePreguntasByEnsayo, useRespuestasByEnsayo, useAusenciasByEnsayo } from '@/db'
import {
  calcularResumenCurso,
  generarResumenEjecutivo,
  oasConMenorLogro,
  ejesParaReforzar,
  puntajeSimce,
} from '@/lib/calculos'
import { formatFecha, cn } from '@/lib/utils'
import { useConfigStore } from '@/store'
import { KPICard } from './components/KPICard'
import { HeatmapGrid } from './components/HeatmapGrid'
import { TablaEstudiantes } from './components/TablaEstudiantes'
import { SeleccionEnsayoResultados } from './SeleccionEnsayoResultados'

const PIE_COLORS = {
  Adecuado: '#10b981',
  Elemental: '#f59e0b',
  Insuficiente: '#ef4444',
}

function barColor(pct: number): string {
  if (pct >= 75) return '#10b981'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

export function ResultadosPage() {
  const { ensayoId } = useParams<{ ensayoId: string }>()
  const { umbrales } = useConfigStore()
  const [copied, setCopied] = useState(false)

  const ensayo = useEnsayo(ensayoId)
  const curso = useCurso(ensayo?.cursoId)
  const estudiantes = useEstudiantesByCurso(ensayo?.cursoId)
  const preguntas = usePreguntasByEnsayo(ensayoId)
  const respuestas = useRespuestasByEnsayo(ensayoId)
  const ausentes = useAusenciasByEnsayo(ensayoId)

  const resumen = useMemo(() => {
    if (!ensayoId || !estudiantes?.length || !preguntas?.length || !respuestas) return null
    return calcularResumenCurso(ensayoId, estudiantes, preguntas, respuestas, umbrales, ausentes)
  }, [estudiantes, preguntas, respuestas, ensayoId, umbrales, ausentes])

  const loading = !ensayo || !estudiantes || !preguntas || !respuestas

  if (!ensayoId) return <SeleccionEnsayoResultados />

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {['a', 'b', 'c', 'd'].map((k) => <Skeleton key={k} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (!resumen) {
    return (
      <div>
        <Topbar title={ensayo.nombre} subtitle="Sin resultados aún" />
        <div className="p-6 text-center text-muted-foreground">
          <p>No hay respuestas ingresadas aún.</p>
          <Button className="mt-4" asChild>
            <Link to={`/correccion/${ensayoId}`}>Ingresar respuestas</Link>
          </Button>
        </div>
      </div>
    )
  }

  const oasBajos = oasConMenorLogro(resumen, 5)
  const ejesBajos = ejesParaReforzar(resumen)

  const pieData = Object.entries(resumen.distribucion).map(([nivel, count]) => ({
    name: nivel,
    value: count,
  }))

  const ejeData = resumen.resultadosPorEje.map((e) => ({
    name: e.eje.split(' ')[0],
    fullName: e.eje,
    porcentaje: e.porcentaje,
  }))

  const preguntaData = [...resumen.resultadosPorPregunta]
    .sort((a, b) => a.porcentaje - b.porcentaje)
    .map((p) => ({
      name: `P${p.numero}`,
      porcentaje: p.porcentaje,
      eje: p.eje,
      oa: p.oa,
    }))

  const rankingData = [...resumen.resultadosEstudiantes]
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 15)

  const resumenTexto = generarResumenEjecutivo(resumen, ensayo.nombre, curso?.nombre ?? '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resumenTexto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div id="dashboard-export">
      <Topbar
        title={ensayo.nombre}
        subtitle={`${curso?.nombre ?? ''} · ${formatFecha(ensayo.fecha)}`}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link to="/exportar"><Download className="h-4 w-4" /> Exportar</Link>
          </Button>
        }
      />

      <div className="p-6 space-y-6 max-w-6xl">
        <Button variant="ghost" size="sm" className="gap-1 -ml-1" asChild>
          <Link to="/resultados"><ArrowLeft className="h-4 w-4" /> Resultados</Link>
        </Button>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard label="Promedio curso" value={`${resumen.promedio}%`} sub={`${resumen.totalEvaluados} evaluados`} />
          <KPICard label="Puntaje SIMCE" value={`${puntajeSimce(resumen.promedio)}`} sub="escala 100–400" />
          <KPICard label="Adecuado" value={`${resumen.porcentajeAdecuado}%`} sub={`${resumen.distribucion.Adecuado} estudiantes`} color="emerald" />
          <KPICard label="Elemental" value={`${resumen.porcentajeElemental}%`} sub={`${resumen.distribucion.Elemental} estudiantes`} color="amber" />
          <KPICard label="Insuficiente" value={`${resumen.porcentajeInsuficiente}%`} sub={`${resumen.distribucion.Insuficiente} estudiantes`} color="red" />
        </div>

        <Tabs defaultValue="graficos">
          <TabsList className="mb-4">
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
            <TabsTrigger value="pedagogico">Análisis pedagógico</TabsTrigger>
          </TabsList>

          <TabsContent value="graficos" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribución por nivel de desempeño</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center gap-6 pb-4">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} estudiantes`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[d.name as keyof typeof PIE_COLORS] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold ml-auto pl-4">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">% logro por eje OA</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ejeData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Logro']}
                        labelFormatter={(l, payload) => payload[0]?.payload?.fullName ?? l}
                      />
                      <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]}>
                        {ejeData.map((entry) => (
                          <Cell key={entry.name} fill={barColor(entry.porcentaje)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">% logro por pregunta (ordenado de menor a mayor)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={preguntaData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={Math.floor(preguntaData.length / 15)} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v, _n, props) => [`${v}% · ${props.payload.oa || 'sin OA'}`, 'Logro']}
                      labelFormatter={(l, payload) => `${l} — ${payload[0]?.payload?.eje ?? ''}`}
                    />
                    <Bar dataKey="porcentaje" radius={[3, 3, 0, 0]}>
                      {preguntaData.map((entry) => (
                        <Cell key={entry.name} fill={barColor(entry.porcentaje)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ranking de estudiantes (top 15)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingData} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Logro']} />
                    <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]}>
                      {rankingData.map((entry) => (
                        <Cell key={entry.estudianteId} fill={barColor(entry.porcentaje)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <HeatmapGrid
              estudiantes={resumen.resultadosEstudiantes}
              preguntas={preguntas}
            />
          </TabsContent>

          <TabsContent value="estudiantes">
            <TablaEstudiantes resultados={resumen.resultadosEstudiantes} umbrales={umbrales} />
          </TabsContent>

          <TabsContent value="pedagogico" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">5 OA con menor logro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {oasBajos.map((p) => (
                    <div key={p.numero} className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">P{p.numero}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{p.oa || 'Sin OA'}</span>
                          <span className="text-xs text-muted-foreground">· {p.eje}</span>
                        </div>
                        <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', p.porcentaje >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                            style={{ width: `${p.porcentaje}%` }}
                          />
                        </div>
                      </div>
                      <span className={cn('text-sm font-bold shrink-0', p.porcentaje >= 50 ? 'text-amber-600' : 'text-red-600')}>
                        {p.porcentaje}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {ejesBajos.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800 dark:text-amber-300">
                    Ejes para reforzar (&lt; 60% logro)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ejesBajos.map((e) => (
                      <Badge key={e.eje} variant="warning">
                        {e.eje} — {e.porcentaje}%
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">Resumen ejecutivo</CardTitle>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed bg-muted/50 rounded-lg p-4">
                  {resumenTexto}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
