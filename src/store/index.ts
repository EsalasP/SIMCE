import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, UmbralesDesempeno, ConfigInstitucional } from '@/types'
import { UMBRALES_DEFAULT } from '@/lib/calculos'

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  setTheme: (t: Theme) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'simce-ui' },
  ),
)

// ─── Config Store ─────────────────────────────────────────────────────────────

interface ConfigState {
  config: ConfigInstitucional
  umbrales: UmbralesDesempeno
  setConfig: (c: Partial<ConfigInstitucional>) => void
  setUmbrales: (u: UmbralesDesempeno) => void
}

const CONFIG_DEFAULT: ConfigInstitucional = {
  nombreColegio: 'Colegio Brasilia',
  colorPrimario: '#1e40af',
  colorSecundario: '#3b82f6',
  umbrales: UMBRALES_DEFAULT,
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: CONFIG_DEFAULT,
      umbrales: UMBRALES_DEFAULT,
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
      setUmbrales: (umbrales) => set({ umbrales }),
    }),
    { name: 'simce-config' },
  ),
)

// ─── Ensayo activo ────────────────────────────────────────────────────────────

interface EnsayoActivoState {
  ensayoId: number | null
  setEnsayoActivo: (id: number | null) => void
}

export const useEnsayoActivoStore = create<EnsayoActivoState>()((set) => ({
  ensayoId: null,
  setEnsayoActivo: (ensayoId) => set({ ensayoId }),
}))
