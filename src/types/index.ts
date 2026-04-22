// ─── Dominio ─────────────────────────────────────────────────────────────────

export type Nivel = '4°' | '6°' | '8°' | 'II°'
export type Asignatura = 'Matemática' | 'Lectura'
export type Respuesta = 'A' | 'B' | 'C' | 'D' | 'omitida'

export type EjeMatematica =
  | 'Números y Operaciones'
  | 'Patrones y Álgebra'
  | 'Geometría'
  | 'Medición'
  | 'Datos y Probabilidades'

export type EjeLectura =
  | 'Comprensión lectora'
  | 'Vocabulario en contexto'
  | 'Producción de textos'
  | 'Localizar información'
  | 'Interpretar e integrar'
  | 'Reflexionar y evaluar'

export type Eje = EjeMatematica | EjeLectura

export type HabilidadMatematica =
  | 'Resolver problemas'
  | 'Representar'
  | 'Modelar'
  | 'Argumentar y comunicar'

export type HabilidadLectura =
  | 'Localizar'
  | 'Interpretar'
  | 'Reflexionar y evaluar'
  | 'Vocabulario'

export type Habilidad = HabilidadMatematica | HabilidadLectura

export type NivelDesempeno = 'Adecuado' | 'Elemental' | 'Insuficiente'

// ─── Modelos de base de datos ─────────────────────────────────────────────────

export interface Curso {
  id?: string
  nombre: string
  nivel: Nivel
  anio: number
  creadoEn: Date
}

export interface Estudiante {
  id?: string
  cursoId: string
  nombre: string
  rut?: string
  creadoEn: Date
}

export interface Ensayo {
  id?: string
  nombre: string
  nivel: Nivel
  asignatura: Asignatura
  fecha: Date
  numPreguntas: number
  cursoId: string
  creadoEn: Date
}

export type TipoPregunta = 'alternativa' | 'desarrollo'

export interface Pregunta {
  id?: string
  ensayoId: string
  numero: number
  tipoPregunta?: TipoPregunta   // undefined = 'alternativa' (retrocompatible)
  respuestaCorrecta: Exclude<Respuesta, 'omitida'>
  puntajeMaximo?: number        // solo para desarrollo (ej. 2 = 0/1/2 pts)
  eje: Eje
  habilidad: Habilidad
  oa: string
}

export interface RespuestaEstudiante {
  id?: string
  ensayoId: string
  estudianteId: string
  numeroPregunta: number
  respuesta: Respuesta           // 'omitida' cuando es desarrollo sin puntaje
  puntaje?: number              // solo para desarrollo
}

// ─── Umbrales de desempeño ────────────────────────────────────────────────────

export interface UmbralesDesempeno {
  adecuado: number
  elemental: number
}

// ─── Resultados calculados ────────────────────────────────────────────────────

export interface ResultadoEstudiante {
  estudianteId: string
  nombre: string
  correctas: number
  total: number
  porcentaje: number
  nivelDesempeno: NivelDesempeno
  porEje: Partial<Record<Eje, { correctas: number; total: number; porcentaje: number }>>
  respuestas: Record<number, Respuesta>
}

export interface ResultadoPregunta {
  numero: number
  eje: Eje
  habilidad: Habilidad
  oa: string
  correctas: number
  total: number
  porcentaje: number
}

export interface ResultadoEje {
  eje: Eje
  correctas: number
  total: number
  porcentaje: number
}

export interface ResumenCurso {
  ensayoId: string
  totalEvaluados: number
  promedio: number
  distribucion: Record<NivelDesempeno, number>
  porcentajeAdecuado: number
  porcentajeElemental: number
  porcentajeInsuficiente: number
  resultadosPorPregunta: ResultadoPregunta[]
  resultadosPorEje: ResultadoEje[]
  resultadosEstudiantes: ResultadoEstudiante[]
}

// ─── Configuración institucional ──────────────────────────────────────────────

export interface ConfigInstitucional {
  nombreColegio: string
  logoUrl?: string
  colorPrimario: string
  colorSecundario: string
  umbrales: UmbralesDesempeno
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'

export interface NavItem {
  label: string
  path: string
  icon: string
}
