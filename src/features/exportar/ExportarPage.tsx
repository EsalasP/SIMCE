import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  getAusenciasByEnsayo,
} from '@/db'
import { calcularResumenCurso } from '@/lib/calculos'
import { useConfigStore } from '@/store'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ReporteTemplate } from './ReporteTemplate'
import type { Ensayo, Curso, ResumenCurso } from '@/types'

interface ReporteData {
  ensayo: Ensayo
  curso: Curso | null
  resumen: ResumenCurso
}

export function ExportarPage() {
  const ensayos = useEnsayos()
  const cursos = useCursos()
  const { umbrales, config } = useConfigStore()
  const [ensayoId, setEnsayoId] = useState<string>('')
  const [loadingXlsx, setLoadingXlsx] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [reporteData, setReporteData] = useState<ReporteData | null>(null)
  const reporteRef = useRef<HTMLDivElement>(null)

  const cursoMap = Object.fromEntries((cursos ?? []).map((c) => [c.id ?? '', c]))

  const handleExportXlsx = async () => {
    if (!ensayoId) return
    setLoadingXlsx(true)
    const ensayo = await getEnsayo(ensayoId)
    if (!ensayo) { setLoadingXlsx(false); return }

    const [estudiantes, preguntas, respuestas, ausentes] = await Promise.all([
      getEstudiantesByCurso(ensayo.cursoId),
      getPreguntasByEnsayo(ensayoId),
      getRespuestasByEnsayo(ensayoId),
      getAusenciasByEnsayo(ensayoId),
    ])
    const resumen = calcularResumenCurso(ensayoId, estudiantes, preguntas, respuestas, umbrales, ausentes)

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

    const ensayo = await getEnsayo(ensayoId)
    if (!ensayo) { setLoadingPdf(false); return }

    const [estudiantes, preguntas, respuestas, ausentes] = await Promise.all([
      getEstudiantesByCurso(ensayo.cursoId),
      getPreguntasByEnsayo(ensayoId),
      getRespuestasByEnsayo(ensayoId),
      getAusenciasByEnsayo(ensayoId),
    ])
    const resumen = calcularResumenCurso(ensayoId, estudiantes, preguntas, respuestas, umbrales, ausentes)
    const curso = cursoMap[ensayo.cursoId] ?? null

    // Render template then capture
    setReporteData({ ensayo, curso, resumen })

    // Wait for React to render the portal
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    if (!reporteRef.current) { setLoadingPdf(false); return }

    const canvas = await html2canvas(reporteRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()   // 210mm
    const pageH = pdf.internal.pageSize.getHeight()  // 297mm
    const margin = 12                                 // mm all sides
    const contentW = pageW - margin * 2              // 186mm
    const contentH = pageH - margin * 2              // 273mm

    // canvas.width is 2× real px due to scale:2
    const ratio = contentW / (canvas.width / 2)
    const totalH = (canvas.height / 2) * ratio

    let page = 0
    let remaining = totalH

    while (remaining > 0) {
      if (page > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, margin - page * contentH, contentW, totalH)
      page++
      remaining -= contentH
    }

    pdf.save(`${ensayo.nombre.replaceAll(/\s+/g, '_')}_reporte.pdf`)
    setReporteData(null)
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
                  {e.nombre} — {cursoMap[e.cursoId]?.nombre ?? ''}
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
                  <CardTitle className="text-sm">Reporte PDF</CardTitle>
                  <CardDescription className="text-xs">Para consejo de profesores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Genera un reporte con KPIs, distribución de niveles, resultados por eje y tabla de estudiantes.
              </p>
              <Button
                className="w-full"
                disabled={!ensayoId || loadingPdf}
                onClick={handleExportPdf}
              >
                {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {loadingPdf ? 'Generando PDF…' : 'Descargar PDF'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portal offscreen para renderizar el reporte antes de capturar */}
      {reporteData && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <div ref={reporteRef}>
            <ReporteTemplate
              ensayo={reporteData.ensayo}
              curso={reporteData.curso}
              resumen={reporteData.resumen}
              nombreColegio={config.nombreColegio}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
