import type {
  Pregunta,
  RespuestaEstudiante,
  Estudiante,
  Eje,
  EjeMatematica,
  EjeLectura,
  NivelDesempeno,
  ResultadoEstudiante,
  ResultadoPregunta,
  ResultadoEje,
  ResumenCurso,
  UmbralesDesempeno,
  Respuesta,
} from '@/types'

export const EJES: EjeMatematica[] = [
  'Números y Operaciones',
  'Patrones y Álgebra',
  'Geometría',
  'Medición',
  'Datos y Probabilidades',
]

export const EJES_LECTURA: EjeLectura[] = [
  'Comprensión lectora',
  'Vocabulario en contexto',
  'Producción de textos',
  'Localizar información',
  'Interpretar e integrar',
  'Reflexionar y evaluar',
]

export const UMBRALES_DEFAULT: UmbralesDesempeno = { adecuado: 75, elemental: 50 }

export function nivelDesempeno(
  porcentaje: number,
  umbrales: UmbralesDesempeno = UMBRALES_DEFAULT,
): NivelDesempeno {
  if (porcentaje >= umbrales.adecuado) return 'Adecuado'
  if (porcentaje >= umbrales.elemental) return 'Elemental'
  return 'Insuficiente'
}

export function calcularResultadoEstudiante(
  estudiante: Estudiante,
  preguntas: Pregunta[],
  respuestas: RespuestaEstudiante[],
  umbrales: UmbralesDesempeno = UMBRALES_DEFAULT,
): ResultadoEstudiante {
  const respMap: Record<number, Respuesta> = {}
  const puntajeMap: Record<number, number> = {}
  for (const r of respuestas) {
    respMap[r.numeroPregunta] = r.respuesta
    if (r.puntaje !== undefined) puntajeMap[r.numeroPregunta] = r.puntaje
  }

  const ejesUsados = [...new Set(preguntas.map((p) => p.eje))] as Eje[]

  let puntajeObtenido = 0
  let puntajeTotal = 0
  const ejeContadores: Partial<Record<Eje, { correctas: number; total: number }>> = {}
  for (const eje of ejesUsados) ejeContadores[eje] = { correctas: 0, total: 0 }

  for (const p of preguntas) {
    const esDesarrollo = p.tipoPregunta === 'desarrollo'
    const maxPts = esDesarrollo ? (p.puntajeMaximo ?? 2) : 1
    puntajeTotal += maxPts

    let pts: number
    if (esDesarrollo) {
      pts = Math.min(puntajeMap[p.numero] ?? 0, maxPts)
    } else {
      const resp = respMap[p.numero] ?? 'omitida'
      pts = resp === p.respuestaCorrecta ? 1 : 0
    }
    puntajeObtenido += pts

    const contador = ejeContadores[p.eje]
    if (contador) {
      contador.total += maxPts
      contador.correctas += pts
    }
  }

  const porcentaje = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 100) : 0

  const porEje: ResultadoEstudiante['porEje'] = {}
  for (const eje of ejesUsados) {
    const c = ejeContadores[eje]
    if (c) {
      porEje[eje] = {
        correctas: c.correctas,
        total: c.total,
        porcentaje: c.total > 0 ? Math.round((c.correctas / c.total) * 100) : 0,
      }
    }
  }

  return {
    estudianteId: estudiante.id ?? '',
    nombre: estudiante.nombre,
    correctas: puntajeObtenido,
    total: puntajeTotal,
    porcentaje,
    nivelDesempeno: nivelDesempeno(porcentaje, umbrales),
    porEje,
    respuestas: respMap,
  }
}

export function calcularResultadosPorPregunta(
  preguntas: Pregunta[],
  todasRespuestas: RespuestaEstudiante[],
  totalEstudiantes: number,
): ResultadoPregunta[] {
  return preguntas.map((p) => {
    const respuestasP = todasRespuestas.filter((r) => r.numeroPregunta === p.numero)
    const esDesarrollo = p.tipoPregunta === 'desarrollo'
    const maxPts = esDesarrollo ? (p.puntajeMaximo ?? 2) : 1

    let correctas: number
    let total: number
    if (esDesarrollo) {
      correctas = respuestasP.reduce((sum, r) => sum + Math.min(r.puntaje ?? 0, maxPts), 0)
      total = totalEstudiantes * maxPts
    } else {
      correctas = respuestasP.filter((r) => r.respuesta === p.respuestaCorrecta).length
      total = totalEstudiantes
    }

    return {
      numero: p.numero,
      eje: p.eje,
      habilidad: p.habilidad,
      oa: p.oa,
      correctas,
      total,
      porcentaje: total > 0 ? Math.round((correctas / total) * 100) : 0,
    }
  })
}

export function calcularResultadosPorEje(
  resultadosPorPregunta: ResultadoPregunta[],
): ResultadoEje[] {
  const ejesUnicos = [...new Set(resultadosPorPregunta.map((p) => p.eje))]
  return ejesUnicos.map((eje) => {
    const pregs = resultadosPorPregunta.filter((p) => p.eje === eje)
    const correctas = pregs.reduce((acc, p) => acc + p.correctas, 0)
    const total = pregs.reduce((acc, p) => acc + p.total, 0)
    return {
      eje,
      correctas,
      total,
      porcentaje: total > 0 ? Math.round((correctas / total) * 100) : 0,
    }
  }).filter((r) => r.total > 0)
}

export function calcularResumenCurso(
  ensayoId: string,
  estudiantes: Estudiante[],
  preguntas: Pregunta[],
  todasRespuestas: RespuestaEstudiante[],
  umbrales: UmbralesDesempeno = UMBRALES_DEFAULT,
  ausentes: Set<string> = new Set(),
): ResumenCurso {
  const estudiantesPresentes = estudiantes.filter((e) => !ausentes.has(e.id ?? ''))
  const resultadosEstudiantes = estudiantesPresentes.map((est) => {
    const resps = todasRespuestas.filter((r) => r.estudianteId === est.id)
    return calcularResultadoEstudiante(est, preguntas, resps, umbrales)
  })

  const totalEvaluados = resultadosEstudiantes.length
  const promedio =
    totalEvaluados > 0
      ? Math.round(
          resultadosEstudiantes.reduce((acc, r) => acc + r.porcentaje, 0) / totalEvaluados,
        )
      : 0

  const distribucion: Record<NivelDesempeno, number> = {
    Adecuado: 0,
    Elemental: 0,
    Insuficiente: 0,
  }
  for (const r of resultadosEstudiantes) distribucion[r.nivelDesempeno]++

  const resultadosPorPregunta = calcularResultadosPorPregunta(
    preguntas,
    todasRespuestas,
    totalEvaluados,
  )
  const resultadosPorEje = calcularResultadosPorEje(resultadosPorPregunta)

  return {
    ensayoId,
    totalEvaluados,
    promedio,
    distribucion,
    porcentajeAdecuado: totalEvaluados > 0 ? Math.round((distribucion.Adecuado / totalEvaluados) * 100) : 0,
    porcentajeElemental: totalEvaluados > 0 ? Math.round((distribucion.Elemental / totalEvaluados) * 100) : 0,
    porcentajeInsuficiente: totalEvaluados > 0 ? Math.round((distribucion.Insuficiente / totalEvaluados) * 100) : 0,
    resultadosPorPregunta,
    resultadosPorEje,
    resultadosEstudiantes,
  }
}

// ─── Conversión a escala SIMCE (100–400) ─────────────────────────────────────

export function puntajeSimce(porcentaje: number): number {
  return Math.round(100 + Math.max(0, Math.min(100, porcentaje)) * 3)
}

// ─── Análisis pedagógico ──────────────────────────────────────────────────────

export function oasConMenorLogro(resumen: ResumenCurso, n = 5): ResultadoPregunta[] {
  return [...resumen.resultadosPorPregunta]
    .sort((a, b) => a.porcentaje - b.porcentaje)
    .slice(0, n)
}

export function ejesParaReforzar(resumen: ResumenCurso, umbral = 60): ResultadoEje[] {
  return resumen.resultadosPorEje.filter((e) => e.porcentaje < umbral)
}

export function estudiantesEnRiesgo(
  historiales: Array<{ estudianteId: string; nombre: string; nivel: NivelDesempeno }[]>,
): Array<{ estudianteId: string; nombre: string }> {
  if (historiales.length < 2) return []
  const ultimo = historiales[historiales.length - 1]
  const penultimo = historiales[historiales.length - 2]
  const penultimoMap = new Map(penultimo.map((e) => [e.estudianteId, e.nivel]))
  return ultimo
    .filter(
      (e) =>
        e.nivel === 'Insuficiente' && penultimoMap.get(e.estudianteId) === 'Insuficiente',
    )
    .map(({ estudianteId, nombre }) => ({ estudianteId, nombre }))
}

export function generarResumenEjecutivo(
  resumen: ResumenCurso,
  nombreEnsayo: string,
  nombreCurso: string,
): string {
  const fecha = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const oasBajos = oasConMenorLogro(resumen, 3)
  const ejesBajos = ejesParaReforzar(resumen)

  const lines = [
    `RESUMEN EJECUTIVO — ${nombreEnsayo}`,
    `Curso: ${nombreCurso} | Fecha: ${fecha}`,
    '',
    `RESULTADOS GENERALES`,
    `• Estudiantes evaluados: ${resumen.totalEvaluados}`,
    `• Promedio del curso: ${resumen.promedio}%`,
    `• Adecuado: ${resumen.porcentajeAdecuado}% | Elemental: ${resumen.porcentajeElemental}% | Insuficiente: ${resumen.porcentajeInsuficiente}%`,
    '',
    `ÁREAS DE MENOR LOGRO`,
    ...oasBajos.map((p) => `• ${p.oa || `P${p.numero}`} (P${p.numero}): ${p.porcentaje}% de logro`),
    '',
    ejesBajos.length > 0
      ? `EJES PARA REFORZAR\n${ejesBajos.map((e) => `• ${e.eje}: ${e.porcentaje}% de logro`).join('\n')}`
      : 'No se identificaron ejes con logro crítico.',
  ]

  return lines.join('\n')
}
