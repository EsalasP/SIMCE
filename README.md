# SIMCE Brasilia — Corrección y Análisis de Ensayos

Aplicación web para corregir y analizar ensayos SIMCE de Matemática del Colegio Brasilia. Funciona completamente offline usando IndexedDB.

## Instalación en macOS

### Requisitos
- Node.js 18 o superior (`node --version`)
- npm 9 o superior (`npm --version`)

### Pasos

```bash
# 1. Clonar / abrir el proyecto
cd simce-brasilia

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La app abre en **http://localhost:5173**

Al cargar por primera vez se crean automáticamente datos de ejemplo:
- Curso **4° A Básico** con **35 estudiantes ficticios**
- **Ensayo 1 SIMCE Matemática 4°B** con 30 preguntas y todas las respuestas ya ingresadas

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/          # Componentes base (Button, Card, Dialog, etc.)
│   └── layout/      # Sidebar, Topbar, AppLayout
├── features/
│   ├── cursos/      # CRUD cursos y estudiantes
│   ├── ensayos/     # Wizard de 3 pasos
│   ├── correccion/  # Spreadsheet de ingreso de respuestas
│   ├── reportes/    # Dashboard con gráficos
│   └── exportar/    # Excel y PDF
├── db/              # Dexie schema + helpers + seed
├── lib/             # calculos.ts, utils.ts
├── store/           # Zustand (UI + config)
├── hooks/           # useTheme
├── types/           # Tipos TypeScript
└── pages/           # Inicio, Configuracion
```

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Cursos** | Crear/editar/eliminar cursos, importar lista de estudiantes desde Excel |
| **Ensayos** | Wizard 3 pasos: datos → clave de respuestas → eje/habilidad/OA |
| **Corrección** | Tabla spreadsheet editable, pegado masivo desde Excel (⌘V), clic para ciclar A→B→C→D→Omitida |
| **Resultados** | KPIs, torta distribución, barras por eje, heatmap, ranking, análisis pedagógico |
| **Exportar** | Excel con 3 hojas (estudiantes, preguntas, ejes), PDF vía impresión del navegador |
| **Dark mode** | Toggle light/dark/system en la barra superior |

## Atajos de teclado

| Tecla | Acción |
|-------|--------|
| Clic en celda | Cicla A → B → C → D → Omitida |
| ⌘V en la tabla | Pega datos desde Excel/Google Sheets |
| Enter en formularios | Confirma acción |

## Build de producción

```bash
npm run build
# Los archivos quedan en dist/
```

## Deploy en Vercel / Netlify

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Arrastra la carpeta dist/ a netlify.com/drop
```

> La app es 100% client-side (no requiere servidor). No necesita base de datos externa — todo se guarda en IndexedDB del navegador del usuario.
