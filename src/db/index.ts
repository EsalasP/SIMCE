export { db } from './schema'
export type { SimceDB } from './schema'

// ─── Helpers de acceso ────────────────────────────────────────────────────────

import { db } from './schema'
import type {
  Curso,
  Estudiante,
  Ensayo,
  Pregunta,
  RespuestaEstudiante,
} from '@/types'

// Cursos
export const getCursos = () => db.cursos.toArray()
export const getCurso = (id: number) => db.cursos.get(id)
export const addCurso = (c: Omit<Curso, 'id'>) => db.cursos.add(c)
export const updateCurso = (id: number, c: Partial<Curso>) => db.cursos.update(id, c)
export const deleteCurso = async (id: number) => {
  const estudiantesIds = await db.estudiantes.where('cursoId').equals(id).primaryKeys()
  const ensayosIds = await db.ensayos.where('cursoId').equals(id).primaryKeys()
  await db.transaction('rw', [db.cursos, db.estudiantes, db.ensayos, db.preguntas, db.respuestas], async () => {
    await db.estudiantes.where('cursoId').equals(id).delete()
    for (const eid of ensayosIds) {
      await db.preguntas.where('ensayoId').equals(Number(eid)).delete()
      await db.respuestas.where('ensayoId').equals(Number(eid)).delete()
    }
    await db.ensayos.where('cursoId').equals(id).delete()
    await db.cursos.delete(id)
  })
  return estudiantesIds
}

// Estudiantes
export const getEstudiantesByCurso = (cursoId: number) =>
  db.estudiantes.where('cursoId').equals(cursoId).sortBy('nombre')
export const addEstudiante = (e: Omit<Estudiante, 'id'>) => db.estudiantes.add(e)
export const addEstudiantesEnLote = (es: Omit<Estudiante, 'id'>[]) => db.estudiantes.bulkAdd(es)
export const updateEstudiante = (id: number, e: Partial<Estudiante>) => db.estudiantes.update(id, e)
export const deleteEstudiante = (id: number) => db.estudiantes.delete(id)

// Ensayos
export const getEnsayosByCurso = (cursoId: number) =>
  db.ensayos.where('cursoId').equals(cursoId).sortBy('fecha')
export const getEnsayo = (id: number) => db.ensayos.get(id)
export const addEnsayo = (e: Omit<Ensayo, 'id'>) => db.ensayos.add(e)
export const updateEnsayo = (id: number, e: Partial<Ensayo>) => db.ensayos.update(id, e)
export const deleteEnsayo = async (id: number) => {
  await db.transaction('rw', [db.ensayos, db.preguntas, db.respuestas], async () => {
    await db.preguntas.where('ensayoId').equals(id).delete()
    await db.respuestas.where('ensayoId').equals(id).delete()
    await db.ensayos.delete(id)
  })
}

// Preguntas
export const getPreguntasByEnsayo = (ensayoId: number) =>
  db.preguntas.where('ensayoId').equals(ensayoId).sortBy('numero')
export const setPreguntasEnsayo = async (ensayoId: number, preguntas: Omit<Pregunta, 'id'>[]) => {
  await db.transaction('rw', [db.preguntas], async () => {
    await db.preguntas.where('ensayoId').equals(ensayoId).delete()
    await db.preguntas.bulkAdd(preguntas)
  })
}

// Respuestas
export const getRespuestasByEnsayo = (ensayoId: number) =>
  db.respuestas.where('ensayoId').equals(ensayoId).toArray()
export const getRespuestasByEstudiante = (ensayoId: number, estudianteId: number) =>
  db.respuestas.where({ ensayoId, estudianteId }).toArray()
export const upsertRespuesta = async (r: Omit<RespuestaEstudiante, 'id'>) => {
  const existing = await db.respuestas
    .where({ ensayoId: r.ensayoId, estudianteId: r.estudianteId, numeroPregunta: r.numeroPregunta })
    .first()
  if (existing?.id) return db.respuestas.update(existing.id, r)
  return db.respuestas.add(r)
}
export const bulkUpsertRespuestas = async (rs: Omit<RespuestaEstudiante, 'id'>[]) => {
  await db.transaction('rw', [db.respuestas], async () => {
    for (const r of rs) await upsertRespuesta(r)
  })
}
