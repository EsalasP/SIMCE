import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  useEnsayos,
  useCursos,
  getEnsayo,
  getEstudiantesByCurso,
  getPreguntasByEnsayo,
  getRespuestasByEnsayo,
} from '@/db'
import { calcularResumenCurso } from '@/lib/calculos'
import { useConfigStore } from '@/store'
import * as XLSX from 'xlsx'

export function ExportarPage() {
  const ensayos = useEnsayos()
  const cursos = useCursos()
  const { umbrales } = useConfigStore()
  const [ensayoId, setEnsayoId] = useState<string>('')
  const [loadingXlsx, setLoadingXlsx] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const cursoMap = Object.fromEntries((cursos ?? []).map((c) => [c.id ?? '', c.nombre]))

  const handleExportXlsx = async () => {
    if (!ensayoId) return
    setLoadingXlsx(true)
    const ensayo = await getEnsayo(ensayoId)
    if (!ensayo) { setLoadingXlsx(false); return }

    const estudiantes = await getEstudiantesByCurso(ensayo.cursoId)
    const preguntas = await getPreguntasByEnsayo(ensayoId)
    const respuestas = await getRespuestasByEnsayo(ensayoId)
    const resumen = calcularResumenCurso(ensayoId, estudiantes, preguntas, respuestas, umbrales)

    const wsData1 = [
      ['Estudiante', '% Logro', 'Correctas', 'Total', 'Nivel', ...preguntas.map((p) => `P${p.numero}`)],
      ...resumen.resultadosEstudiantes.map((r) => [
        r.nombre,
        r.porcentaje,
        r.correctas,
        r.total,
        r.nivelDesempeno,
        ...preguntas.map((p) => r.respuestas[p.numero] ?? ''),
      ]),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(wsData1)

    const wsData2 = [
      ['N° Pregunta', 'OA', 'Eje', 'Habilidad', 'Clave', '% Logro', 'Correctas', 'Total'],
      ...preguntas.map((p) => {
        const rp = resumen.resultadosPorPregunta.find((r) => r.numero === p.numero)
        return [p.numero, p.oa, p.eje, p.habilidad, p.respuestaCorrecta, rp?.porcentaje ?? 0, rp?.correctas ?? 0, rp?.total ?? 0]
      }),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(wsData2)

    const wsData3 = [
      ['Eje', '% Logro', 'Correctas', 'Total'],
      ...resumen.resultadosPorEje.map((e) => [e.eje, e.porcentaje, e.correctas, e.total]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(wsData3)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws1, 'Estudiantes')
    XLSX.utils.book_append_sheet(wb, ws2, 'Preguntas')
    XLSX.utils.book_append_sheet(wb, ws3, 'Ejes')
    XLSX.writeFile(wb, `${ensayo.nombre.replaceAll(/\s+/g, '_')}_resultados.xlsx`)
    setLoadingXlsx(false)
  }

  const handleExportPdf = async () => {
    if (!ensayoId) return
    setLoadingPdf(true)
    window.open(`/resultados/${ensayoId}?print=1`, '_blank')
    setLoadingPdf(false)
  }

  return (
    <div>
      <Topbar title="Exportar" subtitle="Descarga reportes en Excel o PDF" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="space-y-1.5">
          <Label>Selecciona un ensayo</Label>
          <Select value={ensayoId} onValueChange={setEnsayoId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Seleccionar ensayo…" />
            </SelectTrigger>
            <SelectContent>
              {ensayos?.map((e) => (
                <SelectItem key={e.id} value={e.id ?? ''}>
                  {e.nombre} — {cursoMap[e.cursoId] ?? ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Excel completo</CardTitle>
                  <CardDescription className="text-xs">Datos crudos + resultados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Incluye 3 hojas: estudiantes con respuestas, análisis por pregunta y análisis por eje OA.
              </p>
              <Button
                className="w-full"
                variant="outline"
                disabled={!ensayoId || loadingXlsx}
                onClick={handleExportXlsx}
              >
                {loadingXlsx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar .xlsx
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">PDF del dashboard</CardTitle>
                  <CardDescription className="text-xs">Para consejo de profesores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Abre el dashboard en una nueva pestaña. Usa <strong>Archivo → Imprimir → Guardar como PDF</strong> desde el navegador.
              </p>
              <Button
                className="w-full"
                variant="outline"
                disabled={!ensayoId || loadingPdf}
                onClick={handleExportPdf}
              >
                {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Abrir para PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
