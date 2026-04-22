import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCheck } from 'lucide-react'
import { useConfigStore } from '@/store'

export function Configuracion() {
  const { config, umbrales, setConfig, setUmbrales } = useConfigStore()
  const [localConfig, setLocalConfig] = useState({ ...config })
  const [localUmbrales, setLocalUmbrales] = useState({ ...umbrales })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setConfig(localConfig)
    setUmbrales(localUmbrales)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <Topbar title="Configuración" subtitle="Ajusta la app a tu colegio" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Institución */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Configuración institucional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombreColegio">Nombre del colegio</Label>
              <Input
                id="nombreColegio"
                value={localConfig.nombreColegio}
                onChange={(e) => setLocalConfig((c) => ({ ...c, nombreColegio: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="colorPrimario">Color primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorPrimario"
                    type="color"
                    value={localConfig.colorPrimario}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, colorPrimario: e.target.value }))}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={localConfig.colorPrimario}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, colorPrimario: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="colorSecundario">Color secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorSecundario"
                    type="color"
                    value={localConfig.colorSecundario}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, colorSecundario: e.target.value }))}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={localConfig.colorSecundario}
                    onChange={(e) => setLocalConfig((c) => ({ ...c, colorSecundario: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Umbrales de desempeño */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Umbrales de desempeño</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define los porcentajes mínimos para cada nivel de desempeño.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                <Label className="w-28">Adecuado (≥)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={localUmbrales.adecuado}
                  onChange={(e) => setLocalUmbrales((u) => ({ ...u, adecuado: parseInt(e.target.value) || u.adecuado }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                <Label className="w-28">Elemental (≥)</Label>
                <Input
                  type="number"
                  min={1}
                  max={localUmbrales.adecuado - 1}
                  value={localUmbrales.elemental}
                  onChange={(e) => setLocalUmbrales((u) => ({ ...u, elemental: parseInt(e.target.value) || u.elemental }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <Label className="w-28">Insuficiente</Label>
                <span className="text-sm text-muted-foreground">
                  {'< '}{localUmbrales.elemental}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full sm:w-auto">
          {saved ? <><CheckCheck className="h-4 w-4" /> Guardado</> : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
