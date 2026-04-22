import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ResultadoEstudiante, Pregunta, Respuesta } from '@/types'

interface HeatmapGridProps {
  estudiantes: ResultadoEstudiante[]
  preguntas: Pregunta[]
}

export function HeatmapGrid({ estudiantes, preguntas }: HeatmapGridProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Heatmap: estudiantes × preguntas</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-400" /> Correcta</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-400" /> Incorrecta</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/30" /> Omitida/Sin resp.</span>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="text-left pr-2 py-1 font-medium text-muted-foreground min-w-[140px] sticky left-0 bg-card">
                Estudiante
              </th>
              {preguntas.map((p) => (
                <th key={p.numero} className="w-5 text-center font-medium text-muted-foreground rotate-0 pb-1">
                  {p.numero}
                </th>
              ))}
              <th className="pl-2 text-center font-medium text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est) => (
              <tr key={est.estudianteId}>
                <td className="pr-2 py-0.5 font-medium sticky left-0 bg-card text-xs truncate max-w-[140px]">
                  {est.nombre}
                </td>
                {preguntas.map((p) => {
                  const resp: Respuesta | undefined = est.respuestas[p.numero]
                  const isCorrect = resp === p.respuestaCorrecta
                  const isOmitted = !resp || resp === 'omitida'
                  return (
                    <td key={p.numero} className="p-0.5">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-sm',
                          isOmitted
                            ? 'bg-muted-foreground/20'
                            : isCorrect
                              ? 'bg-emerald-400 dark:bg-emerald-500'
                              : 'bg-red-400 dark:bg-red-500',
                        )}
                        title={`P${p.numero}: ${resp ?? 'sin resp'} (correcta: ${p.respuestaCorrecta})`}
                      />
                    </td>
                  )
                })}
                <td className="pl-2 text-center font-semibold">
                  <span
                    className={cn(
                      est.porcentaje >= 75
                        ? 'text-emerald-600'
                        : est.porcentaje >= 50
                          ? 'text-amber-600'
                          : 'text-red-600',
                    )}
                  >
                    {est.porcentaje}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
