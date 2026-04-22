import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useTheme } from '@/hooks/useTheme'
import { Inicio } from '@/pages/Inicio'
import { Configuracion } from '@/pages/Configuracion'
import { CursosPage } from '@/features/cursos/CursosPage'
import { CursoDetalle } from '@/features/cursos/CursoDetalle'
import { EnsayosPage } from '@/features/ensayos/EnsayosPage'
import { NuevoEnsayoWizard } from '@/features/ensayos/NuevoEnsayoWizard'
import { SeleccionEnsayoCorreccion } from '@/features/correccion/SeleccionEnsayoCorreccion'
import { CorreccionPage } from '@/features/correccion/CorreccionPage'
import { SeleccionEnsayoResultados } from '@/features/reportes/SeleccionEnsayoResultados'
import { ResultadosPage } from '@/features/reportes/ResultadosPage'
import { ExportarPage } from '@/features/exportar/ExportarPage'

function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useTheme()
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Inicio />} />
            <Route path="cursos" element={<CursosPage />} />
            <Route path="cursos/:id" element={<CursoDetalle />} />
            <Route path="ensayos" element={<EnsayosPage />} />
            <Route path="ensayos/nuevo" element={<NuevoEnsayoWizard />} />
            <Route path="correccion" element={<SeleccionEnsayoCorreccion />} />
            <Route path="correccion/:ensayoId" element={<CorreccionPage />} />
            <Route path="resultados" element={<SeleccionEnsayoResultados />} />
            <Route path="resultados/:ensayoId" element={<ResultadosPage />} />
            <Route path="exportar" element={<ExportarPage />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
