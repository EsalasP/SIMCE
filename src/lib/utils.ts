import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NivelDesempeno, Respuesta } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function colorNivel(nivel: NivelDesempeno): string {
  switch (nivel) {
    case 'Adecuado': return 'text-emerald-600 dark:text-emerald-400'
    case 'Elemental': return 'text-amber-600 dark:text-amber-400'
    case 'Insuficiente': return 'text-red-600 dark:text-red-400'
  }
}

export function bgNivel(nivel: NivelDesempeno): string {
  switch (nivel) {
    case 'Adecuado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'Elemental': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'Insuficiente': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  }
}

export function colorRespuesta(
  respuesta: Respuesta,
  correcta: Respuesta,
): 'correct' | 'incorrect' | 'omitted' {
  if (respuesta === 'omitida') return 'omitted'
  return respuesta === correcta ? 'correct' : 'incorrect'
}

export function formatPorcentaje(n: number): string {
  return `${n}%`
}

export function formatFecha(d: Date): string {
  return new Date(d).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Parsea texto pegado desde Excel/Sheets (TSV o CSV)
export function parsePasteData(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((row) => row.split(/\t|,/).map((cell) => cell.trim().toUpperCase()))
}

export function normalizarRespuesta(raw: string): Respuesta | null {
  const upper = raw.trim().toUpperCase()
  if (['A', 'B', 'C', 'D'].includes(upper)) return upper as Respuesta
  if (['O', 'OM', 'OMITIDA', '-', ''].includes(upper)) return 'omitida'
  return null
}
