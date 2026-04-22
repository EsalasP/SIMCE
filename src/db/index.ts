import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { firestore, auth } from '@/lib/firebase'
import type {
  Curso,
  Estudiante,
  Ensayo,
  Pregunta,
  RespuestaEstudiante,
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return auth.currentUser?.uid ?? ''
}

function userCol(name: string) {
  return collection(firestore, 'users', uid(), name)
}

function userDoc(name: string, id: string) {
  return doc(firestore, 'users', uid(), name, id)
}

// Converts Firestore Timestamps to JS Dates recursively (top-level fields only)
function hydrate<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Timestamp) out[k] = v.toDate()
  }
  return out as T
}

// ─── Real-time hooks ──────────────────────────────────────────────────────────

export function useCursos(): Curso[] | undefined {
  const [data, setData] = useState<Curso[] | undefined>(undefined)
  useEffect(() => {
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(collection(firestore, 'users', u.uid, 'cursos'), (snap) =>
      setData(
        snap.docs
          .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Curso)
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      ),
    )
  }, [])
  return data
}

export function useCurso(id: string | undefined): Curso | null | undefined {
  const [data, setData] = useState<Curso | null | undefined>(undefined)
  useEffect(() => {
    if (!id) return
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(doc(firestore, 'users', u.uid, 'cursos', id), (d) =>
      setData(d.exists() ? ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id } as Curso) : null),
    )
  }, [id])
  return data
}

export function useEstudiantesByCurso(cursoId: string | undefined): Estudiante[] | undefined {
  const [data, setData] = useState<Estudiante[] | undefined>(undefined)
  useEffect(() => {
    if (!cursoId) return
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(
      query(collection(firestore, 'users', u.uid, 'estudiantes'), where('cursoId', '==', cursoId)),
      (snap) =>
        setData(
          snap.docs
            .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Estudiante)
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        ),
    )
  }, [cursoId])
  return data
}

export function useEstudiantesCountByCurso(): Record<string, number> | undefined {
  const [data, setData] = useState<Record<string, number> | undefined>(undefined)
  useEffect(() => {
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(collection(firestore, 'users', u.uid, 'estudiantes'), (snap) => {
      const map: Record<string, number> = {}
      for (const d of snap.docs) {
        const cursoId = (d.data() as Estudiante).cursoId
        if (cursoId) map[cursoId] = (map[cursoId] ?? 0) + 1
      }
      setData(map)
    })
  }, [])
  return data
}

export function useEnsayos(): Ensayo[] | undefined {
  const [data, setData] = useState<Ensayo[] | undefined>(undefined)
  useEffect(() => {
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(collection(firestore, 'users', u.uid, 'ensayos'), (snap) =>
      setData(
        snap.docs
          .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Ensayo)
          .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
      ),
    )
  }, [])
  return data
}

export function useEnsayo(id: string | undefined): Ensayo | null | undefined {
  const [data, setData] = useState<Ensayo | null | undefined>(undefined)
  useEffect(() => {
    if (!id) return
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(doc(firestore, 'users', u.uid, 'ensayos', id), (d) =>
      setData(d.exists() ? ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id } as Ensayo) : null),
    )
  }, [id])
  return data
}

export function usePreguntasByEnsayo(ensayoId: string | undefined): Pregunta[] | undefined {
  const [data, setData] = useState<Pregunta[] | undefined>(undefined)
  useEffect(() => {
    if (!ensayoId) return
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(
      query(collection(firestore, 'users', u.uid, 'preguntas'), where('ensayoId', '==', ensayoId)),
      (snap) =>
        setData(
          snap.docs
            .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Pregunta)
            .sort((a, b) => a.numero - b.numero),
        ),
    )
  }, [ensayoId])
  return data
}

export function useRespuestasByEnsayo(ensayoId: string | undefined): RespuestaEstudiante[] | undefined {
  const [data, setData] = useState<RespuestaEstudiante[] | undefined>(undefined)
  useEffect(() => {
    if (!ensayoId) return
    const u = auth.currentUser
    if (!u) return
    return onSnapshot(
      query(collection(firestore, 'users', u.uid, 'respuestas'), where('ensayoId', '==', ensayoId)),
      (snap) =>
        setData(
          snap.docs.map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as RespuestaEstudiante),
        ),
    )
  }, [ensayoId])
  return data
}

// ─── Async fetch helpers (for one-shot reads like export) ─────────────────────

export async function getEnsayo(id: string): Promise<Ensayo | null> {
  const snap = await getDoc(userDoc('ensayos', id))
  return snap.exists() ? ({ ...hydrate(snap.data() as Record<string, unknown>), id: snap.id } as Ensayo) : null
}

export async function getEstudiantesByCurso(cursoId: string): Promise<Estudiante[]> {
  const snap = await getDocs(query(userCol('estudiantes'), where('cursoId', '==', cursoId)))
  return snap.docs
    .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Estudiante)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function getPreguntasByEnsayo(ensayoId: string): Promise<Pregunta[]> {
  const snap = await getDocs(query(userCol('preguntas'), where('ensayoId', '==', ensayoId)))
  return snap.docs
    .map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as Pregunta)
    .sort((a, b) => a.numero - b.numero)
}

export async function getRespuestasByEnsayo(ensayoId: string): Promise<RespuestaEstudiante[]> {
  const snap = await getDocs(query(userCol('respuestas'), where('ensayoId', '==', ensayoId)))
  return snap.docs.map((d) => ({ ...hydrate(d.data() as Record<string, unknown>), id: d.id }) as RespuestaEstudiante)
}

// ─── CRUD — Cursos ────────────────────────────────────────────────────────────

export const addCurso = async (c: Omit<Curso, 'id'>) => {
  const ref = await addDoc(userCol('cursos'), c)
  return ref.id
}

export const updateCurso = async (id: string, c: Partial<Curso>) => {
  await updateDoc(userDoc('cursos', id), c as Record<string, unknown>)
}

export const deleteCurso = async (id: string) => {
  const u = uid()
  const base = `users/${u}`
  const ensayosSnap = await getDocs(query(collection(firestore, base, 'ensayos'), where('cursoId', '==', id)))
  const estudiantesSnap = await getDocs(query(collection(firestore, base, 'estudiantes'), where('cursoId', '==', id)))

  const batch = writeBatch(firestore)
  estudiantesSnap.docs.forEach((d) => batch.delete(d.ref))

  for (const e of ensayosSnap.docs) {
    const eid = e.id
    const pregSnap = await getDocs(query(collection(firestore, base, 'preguntas'), where('ensayoId', '==', eid)))
    const respSnap = await getDocs(query(collection(firestore, base, 'respuestas'), where('ensayoId', '==', eid)))
    pregSnap.docs.forEach((d) => batch.delete(d.ref))
    respSnap.docs.forEach((d) => batch.delete(d.ref))
    batch.delete(e.ref)
  }

  batch.delete(doc(firestore, base, 'cursos', id))
  await batch.commit()
}

// ─── CRUD — Estudiantes ───────────────────────────────────────────────────────

export const addEstudiante = async (e: Omit<Estudiante, 'id'>) => {
  const ref = await addDoc(userCol('estudiantes'), e)
  return ref.id
}

export const addEstudiantesEnLote = async (es: Omit<Estudiante, 'id'>[]) => {
  const batch = writeBatch(firestore)
  for (const e of es) {
    batch.set(doc(userCol('estudiantes')), e)
  }
  await batch.commit()
}

export const deleteEstudiante = async (id: string) => {
  await deleteDoc(userDoc('estudiantes', id))
}

// ─── CRUD — Ensayos ───────────────────────────────────────────────────────────

export const addEnsayo = async (e: Omit<Ensayo, 'id'>) => {
  const ref = await addDoc(userCol('ensayos'), e)
  return ref.id
}

export const deleteEnsayo = async (id: string) => {
  const u = uid()
  const base = `users/${u}`
  const pregSnap = await getDocs(query(collection(firestore, base, 'preguntas'), where('ensayoId', '==', id)))
  const respSnap = await getDocs(query(collection(firestore, base, 'respuestas'), where('ensayoId', '==', id)))

  const batch = writeBatch(firestore)
  pregSnap.docs.forEach((d) => batch.delete(d.ref))
  respSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(firestore, base, 'ensayos', id))
  await batch.commit()
}

// ─── CRUD — Preguntas ─────────────────────────────────────────────────────────

export const setPreguntasEnsayo = async (ensayoId: string, preguntas: Omit<Pregunta, 'id'>[]) => {
  const u = uid()
  const base = `users/${u}`
  const existing = await getDocs(query(collection(firestore, base, 'preguntas'), where('ensayoId', '==', ensayoId)))

  const batch = writeBatch(firestore)
  existing.docs.forEach((d) => batch.delete(d.ref))
  for (const p of preguntas) {
    batch.set(doc(collection(firestore, base, 'preguntas')), p)
  }
  await batch.commit()
}

// ─── CRUD — Respuestas ────────────────────────────────────────────────────────

export const bulkUpsertRespuestas = async (rs: Omit<RespuestaEstudiante, 'id'>[]) => {
  const u = uid()
  const base = `users/${u}`
  const CHUNK = 450
  for (let i = 0; i < rs.length; i += CHUNK) {
    const batch = writeBatch(firestore)
    for (const r of rs.slice(i, i + CHUNK)) {
      const docId = `${r.ensayoId}_${r.estudianteId}_${r.numeroPregunta}`
      batch.set(doc(firestore, base, 'respuestas', docId), r)
    }
    await batch.commit()
  }
}
