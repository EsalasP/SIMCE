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
  id?: number
  nombre: string
  nivel: Nivel
  anio: number
  creadoEn: Date
}

export interface Estudiante {
  id?: number
  cursoId: number
  nombre: string
  rut?: string
  creadoEn: Date
}

export interface Ensayo {
  id?: number
  nombre: string
  nivel: Nivel
  asignatura: Asignatura
  fecha: Date
  numPreguntas: number
  cursoId: number
  creadoEn: Date
}

export interface Pregunta {
  id?: number
  ensayoId: number
  numero: number
  respuestaCorrecta: Exclude<Respuesta, 'omitida'>
  eje: Eje
  habilidad: Habilidad
  oa: string
}

export interface RespuestaEstudiante {
  id?: number
  ensayoId: number
  estudianteId: number
  numeroPregunta: number
  respuesta: Respuesta
}

// ─── Umbrales de desempeño ────────────────────────────────────────────────────

export interface UmbralesDesempeno {
  adecuado: number   // porcentaje mínimo para Adecuado (ej. 75)
  elemental: number  // porcentaje mínimo para Elemental (ej. 50)
}

// ─── Resultados calculados ────────────────────────────────────────────────────

export interface ResultadoEstudiante {
  estudianteId: number
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
  ensayoId: number
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
