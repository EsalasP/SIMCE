import Dexie, { type EntityTable } from 'dexie'
import type {
  Curso,
  Estudiante,
  Ensayo,
  Pregunta,
  RespuestaEstudiante,
} from '@/types'

export class SimceDB extends Dexie {
  cursos!: EntityTable<Curso, 'id'>
  estudiantes!: EntityTable<Estudiante, 'id'>
  ensayos!: EntityTable<Ensayo, 'id'>
  preguntas!: EntityTable<Pregunta, 'id'>
  respuestas!: EntityTable<RespuestaEstudiante, 'id'>

  constructor() {
    super('SimceBrasiliaDB')

    this.version(1).stores({
      cursos: '++id, nivel, anio',
      estudiantes: '++id, cursoId, nombre',
      ensayos: '++id, cursoId, nivel, asignatura, fecha',
      preguntas: '++id, ensayoId, numero',
      respuestas: '++id, ensayoId, estudianteId, numeroPregunta',
    })

    // v2: niveles sin sufijo de letra ('4°B' → '4°', 'II°M' → 'II°')
    this.version(2).stores({
      cursos: '++id, nivel, anio',
      estudiantes: '++id, cursoId, nombre',
      ensayos: '++id, cursoId, nivel, asignatura, fecha',
      preguntas: '++id, ensayoId, numero',
      respuestas: '++id, ensayoId, estudianteId, numeroPregunta',
    }).upgrade(async (tx) => {
      const nivelMap: Record<string, string> = {
        '4°B': '4°',
        '6°B': '6°',
        '8°B': '8°',
        'II°M': 'II°',
      }
      await tx.table('cursos').toCollection().modify((c: Record<string, unknown>) => {
        const mapped = nivelMap[c.nivel as string]
        if (mapped) c.nivel = mapped
      })
      await tx.table('ensayos').toCollection().modify((e: Record<string, unknown>) => {
        const mapped = nivelMap[e.nivel as string]
        if (mapped) e.nivel = mapped
      })
    })
  }
}

export const db = new SimceDB()
