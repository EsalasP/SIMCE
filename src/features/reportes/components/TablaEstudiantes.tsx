import { useState, useMemo } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { bgNivel, cn } from '@/lib/utils'
import type { ResultadoEstudiante, UmbralesDesempeno } from '@/types'

type SortField = 'nombre' | 'porcentaje' | 'nivelDesempeno'
type SortDir = 'asc' | 'desc'

interface TablaEstudiantesProps {
  resultados: ResultadoEstudiante[]
  umbrales: UmbralesDesempeno
}

export function TablaEstudiantes({ resultados }: TablaEstudiantesProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('porcentaje')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    return resultados
      .filter((r) => r.nombre.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre)
        else if (sortField === 'porcentaje') cmp = a.porcentaje - b.porcentaje
        else if (sortField === 'nivelDesempeno') {
          const order = { Adecuado: 2, Elemental: 1, Insuficiente: 0 }
          cmp = order[a.nivelDesempeno] - order[b.nivelDesempeno]
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [resultados, search, sortField, sortDir])

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold" onClick={() => toggleSort(field)}>
      {label} <ArrowUpDown className="h-3 w-3 ml-1" />
    </Button>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Tabla de estudiantes</CardTitle>
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar estudiante…"
              className="h-8 pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-xs text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-2">
                  <SortButton field="nombre" label="Estudiante" />
                </th>
                <th className="text-center px-4 py-2">
                  <SortButton field="porcentaje" label="% Logro" />
                </th>
                <th className="text-center px-4 py-2 text-xs text-muted-foreground font-semibold">Correctas</th>
                <th className="text-center px-4 py-2">
                  <SortButton field="nivelDesempeno" label="Nivel" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.estudianteId} className={cn('border-b last:border-0', idx % 2 === 0 ? '' : 'bg-muted/20')}>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium">{r.nombre}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            r.porcentaje >= 75 ? 'bg-emerald-500' : r.porcentaje >= 50 ? 'bg-amber-400' : 'bg-red-400',
                          )}
                          style={{ width: `${r.porcentaje}%` }}
                        />
                      </div>
                      <span className="font-semibold text-xs w-10">{r.porcentaje}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-muted-foreground">
                    {r.correctas}/{r.total}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', bgNivel(r.nivelDesempeno))}>
                      {r.nivelDesempeno}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
