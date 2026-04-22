import { db } from './schema'
import type { Eje, Habilidad, Respuesta } from '@/types'

const NOMBRES = [
  'Sofía Aguilera Ramos', 'Matías Bravo Soto', 'Isabella Castro Muñoz', 'Benjamín Díaz Vera',
  'Valentina Espinoza Ríos', 'Sebastián Fuentes Pizarro', 'Camila González López', 'Nicolás Herrera Tapia',
  'Emilia Ibáñez Contreras', 'Diego Jara Morales', 'Antonia Kohn Salazar', 'Tomás Lagos Fernández',
  'Florencia Medina Torres', 'Joaquín Navarro Cifuentes', 'Renata Orellana Bustos', 'Cristóbal Pino Reyes',
  'Javiera Quiroga Mena', 'Felipe Rojas Álvarez', 'Martina Saavedra Caro', 'Ignacio Torres Espejo',
  'Catalina Uribe Molina', 'Rodrigo Valenzuela Peña', 'Isidora Weason Fuentes', 'Gonzalo Ximena Lagos',
  'Agustina Yáñez Soto', 'Maximiliano Zamora Ríos', 'Pilar Araya Ibáñez', 'Javier Bascuñán Rojas',
  'Trinidad Castro Herrera', 'Andrés Delgado Fuentes', 'Francisca Encina Bravo', 'Lucas Figueroa Saavedra',
  'Constanza Guzmán Torres', 'Pablo Henríquez Aguilera', 'Elisa Illanes Díaz',
]

interface PreguntaConfig {
  numero: number
  respuestaCorrecta: 'A' | 'B' | 'C' | 'D'
  eje: Eje
  habilidad: Habilidad
  oa: string
}

const PREGUNTAS_CONFIG: PreguntaConfig[] = [
  { numero: 1, respuestaCorrecta: 'B', eje: 'Números y Operaciones', habilidad: 'Resolver problemas', oa: 'MA04OA01' },
  { numero: 2, respuestaCorrecta: 'A', eje: 'Números y Operaciones', habilidad: 'Representar', oa: 'MA04OA01' },
  { numero: 3, respuestaCorrecta: 'C', eje: 'Números y Operaciones', habilidad: 'Resolver problemas', oa: 'MA04OA02' },
  { numero: 4, respuestaCorrecta: 'D', eje: 'Números y Operaciones', habilidad: 'Modelar', oa: 'MA04OA02' },
  { numero: 5, respuestaCorrecta: 'B', eje: 'Números y Operaciones', habilidad: 'Resolver problemas', oa: 'MA04OA03' },
  { numero: 6, respuestaCorrecta: 'A', eje: 'Números y Operaciones', habilidad: 'Representar', oa: 'MA04OA03' },
  { numero: 7, respuestaCorrecta: 'C', eje: 'Patrones y Álgebra', habilidad: 'Resolver problemas', oa: 'MA04OA14' },
  { numero: 8, respuestaCorrecta: 'B', eje: 'Patrones y Álgebra', habilidad: 'Modelar', oa: 'MA04OA14' },
  { numero: 9, respuestaCorrecta: 'D', eje: 'Patrones y Álgebra', habilidad: 'Representar', oa: 'MA04OA15' },
  { numero: 10, respuestaCorrecta: 'A', eje: 'Patrones y Álgebra', habilidad: 'Argumentar y comunicar', oa: 'MA04OA15' },
  { numero: 11, respuestaCorrecta: 'C', eje: 'Geometría', habilidad: 'Resolver problemas', oa: 'MA04OA16' },
  { numero: 12, respuestaCorrecta: 'B', eje: 'Geometría', habilidad: 'Representar', oa: 'MA04OA16' },
  { numero: 13, respuestaCorrecta: 'A', eje: 'Geometría', habilidad: 'Modelar', oa: 'MA04OA17' },
  { numero: 14, respuestaCorrecta: 'D', eje: 'Geometría', habilidad: 'Resolver problemas', oa: 'MA04OA17' },
  { numero: 15, respuestaCorrecta: 'C', eje: 'Geometría', habilidad: 'Argumentar y comunicar', oa: 'MA04OA18' },
  { numero: 16, respuestaCorrecta: 'B', eje: 'Medición', habilidad: 'Resolver problemas', oa: 'MA04OA19' },
  { numero: 17, respuestaCorrecta: 'A', eje: 'Medición', habilidad: 'Representar', oa: 'MA04OA19' },
  { numero: 18, respuestaCorrecta: 'D', eje: 'Medición', habilidad: 'Modelar', oa: 'MA04OA20' },
  { numero: 19, respuestaCorrecta: 'C', eje: 'Medición', habilidad: 'Resolver problemas', oa: 'MA04OA20' },
  { numero: 20, respuestaCorrecta: 'B', eje: 'Medición', habilidad: 'Argumentar y comunicar', oa: 'MA04OA21' },
  { numero: 21, respuestaCorrecta: 'A', eje: 'Datos y Probabilidades', habilidad: 'Resolver problemas', oa: 'MA04OA22' },
  { numero: 22, respuestaCorrecta: 'D', eje: 'Datos y Probabilidades', habilidad: 'Representar', oa: 'MA04OA22' },
  { numero: 23, respuestaCorrecta: 'C', eje: 'Datos y Probabilidades', habilidad: 'Modelar', oa: 'MA04OA23' },
  { numero: 24, respuestaCorrecta: 'B', eje: 'Datos y Probabilidades', habilidad: 'Resolver problemas', oa: 'MA04OA23' },
  { numero: 25, respuestaCorrecta: 'A', eje: 'Números y Operaciones', habilidad: 'Representar', oa: 'MA04OA04' },
  { numero: 26, respuestaCorrecta: 'C', eje: 'Números y Operaciones', habilidad: 'Resolver problemas', oa: 'MA04OA04' },
  { numero: 27, respuestaCorrecta: 'D', eje: 'Patrones y Álgebra', habilidad: 'Modelar', oa: 'MA04OA15' },
  { numero: 28, respuestaCorrecta: 'B', eje: 'Geometría', habilidad: 'Resolver problemas', oa: 'MA04OA18' },
  { numero: 29, respuestaCorrecta: 'A', eje: 'Medición', habilidad: 'Representar', oa: 'MA04OA21' },
  { numero: 30, respuestaCorrecta: 'C', eje: 'Datos y Probabilidades', habilidad: 'Argumentar y comunicar', oa: 'MA04OA23' },
]

const NIVELES_DIST: Array<'alto' | 'medio' | 'bajo'> = [
  'alto', 'alto', 'alto', 'alto', 'alto', 'alto', 'alto', 'alto',
  'medio', 'medio', 'medio', 'medio', 'medio', 'medio', 'medio',
  'medio', 'medio', 'medio', 'medio', 'medio', 'medio', 'medio', 'medio',
  'bajo', 'bajo', 'bajo', 'bajo', 'bajo', 'bajo', 'bajo',
  'bajo', 'bajo', 'bajo', 'bajo', 'bajo',
]

function generarRespuestasEstudiante(
  nivel: 'alto' | 'medio' | 'bajo',
  seed: number,
): Array<{ numeroPregunta: number; respuesta: Respuesta }> {
  const tasas = { alto: 0.85, medio: 0.62, bajo: 0.38 }
  const tasa = tasas[nivel] + (seed % 5) * 0.02 - 0.04
  const alts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
  const result: Array<{ numeroPregunta: number; respuesta: Respuesta }> = []

  for (const p of PREGUNTAS_CONFIG) {
    const r = Math.sin(seed * p.numero * 37) * 0.5 + 0.5
    let respuesta: Respuesta
    if (r < tasa) {
      respuesta = p.respuestaCorrecta
    } else if (r > 0.95) {
      respuesta = 'omitida'
    } else {
      const incorrectas = alts.filter((a) => a !== p.respuestaCorrecta)
      respuesta = incorrectas[Math.floor(r * 3) % 3]
    }
    result.push({ numeroPregunta: p.numero, respuesta })
  }
  return result
}

export async function seedDatabase() {
  const cursosCount = await db.cursos.count()
  if (cursosCount > 0) return

  await db.transaction('rw', [db.cursos, db.estudiantes, db.ensayos, db.preguntas, db.respuestas], async () => {
    // 1. Curso
    const cursoId = Number(await db.cursos.add({
      nombre: '4° A Básico',
      nivel: '4°',
      anio: 2024,
      creadoEn: new Date(),
    }))

    // 2. Estudiantes en lote
    const estudiantesIds = (await db.estudiantes.bulkAdd(
      NOMBRES.map((nombre) => ({ cursoId, nombre, creadoEn: new Date() })),
      { allKeys: true },
    )) as number[]

    // 3. Ensayo
    const ensayoId = Number(await db.ensayos.add({
      nombre: 'Ensayo 1 SIMCE Matemática 4°',
      nivel: '4°',
      asignatura: 'Matemática',
      fecha: new Date('2024-08-15'),
      numPreguntas: 30,
      cursoId,
      creadoEn: new Date(),
    }))

    // 4. Preguntas en lote
    await db.preguntas.bulkAdd(
      PREGUNTAS_CONFIG.map((p) => ({ ...p, ensayoId }))
    )

    // 5. Respuestas en lote (35 × 30 = 1050 filas, una sola transacción)
    const todasRespuestas = estudiantesIds.flatMap((estudianteId, i) => {
      const nivel = NIVELES_DIST[i] ?? 'medio'
      return generarRespuestasEstudiante(nivel, i + 1).map(({ numeroPregunta, respuesta }) => ({
        ensayoId,
        estudianteId,
        numeroPregunta,
        respuesta,
      }))
    })
    await db.respuestas.bulkAdd(todasRespuestas)
  })
}
