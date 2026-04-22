# SIMCE — Corrección y Análisis de Ensayos

Aplicación web para corregir y analizar ensayos SIMCE de **Matemática y Lectura**. Los datos se guardan en la nube mediante **Firebase Firestore** y el acceso requiere inicio de sesión con cuenta Google.

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Cursos** | Crear/editar/eliminar cursos, importar lista de estudiantes desde Excel |
| **Ensayos** | Wizard 3 pasos: datos → clave de respuestas → eje/habilidad/OA. Soporta Matemática y Lectura |
| **Corrección** | Tabla editable, pegado masivo desde Excel (⌘V), clic para ciclar A→B→C→D→Omitida |
| **Resultados** | KPIs, torta distribución, barras por eje, heatmap, ranking, análisis pedagógico |
| **Exportar** | Excel con 3 hojas (estudiantes, preguntas, ejes), PDF vía impresión del navegador |
| **Dark mode** | Toggle light/dark/system en la barra superior |

## Instalación y desarrollo local

### Requisitos
- Node.js 18 o superior (`node --version`)
- npm 9 o superior (`npm --version`)
- Proyecto Firebase configurado (ver sección Firebase)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/EsalasP/SIMCE.git
cd SIMCE

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de configuración local
cp .env.local.example .env.local
# Edita .env.local con los valores de tu proyecto Firebase

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La app abre en **http://localhost:5173**

## Configuración Firebase

### 1. Crear el proyecto

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un proyecto nuevo
3. En **Authentication** → Sign-in method → activa **Google**
4. En **Firestore Database** → Crear base de datos → Modo producción

### 2. Configurar reglas de Firestore

En **Firestore** → Reglas, pega el contenido del archivo `firestore.rules` del repositorio.

### 3. Obtener las credenciales

En **Configuración del proyecto** → Tus apps → Agrega una app Web. Copia los valores del bloque `firebaseConfig` en tu archivo `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Deploy en GitHub Pages

El proyecto incluye un workflow de GitHub Actions que despliega automáticamente al hacer push a `main`.

### Configurar secrets en GitHub

En tu repositorio → **Settings** → **Secrets and variables** → **Actions** → agrega los mismos 6 valores del `.env.local` como secrets de repositorio.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Cada push a `main` dispara el build y despliega en GitHub Pages automáticamente.

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/          # Componentes base (Button, Card, Dialog, etc.)
│   └── layout/      # Sidebar, Topbar, AppLayout
├── features/
│   ├── cursos/      # CRUD cursos y estudiantes
│   ├── ensayos/     # Wizard de 3 pasos (Matemática y Lectura)
│   ├── correccion/  # Spreadsheet de ingreso de respuestas
│   ├── reportes/    # Dashboard con gráficos
│   └── exportar/    # Excel y PDF
├── db/              # Hooks y CRUD sobre Firebase Firestore
├── lib/             # firebase.ts, auth.tsx, calculos.ts, utils.ts
├── store/           # Zustand (UI + config)
├── hooks/           # useTheme
├── types/           # Tipos TypeScript
└── pages/           # Inicio, Login, Configuracion
```

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

> Los datos se guardan en Firebase Firestore, aislados por cuenta Google. La app incluye caché offline: funciona sin internet una vez cargada, y sincroniza al reconectarse.
