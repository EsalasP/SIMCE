import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useConfigStore } from '@/store'

export function Login() {
  const { signInWithGoogle } = useAuth()
  const { config } = useConfigStore()
  const { nombreColegio } = config
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Firebase auth error:', err)
      const code = (err as { code?: string }).code ?? ''
      let msg = 'No se pudo iniciar sesión. Inténtalo de nuevo.'
      if (code === 'auth/popup-blocked') msg = 'El navegador bloqueó la ventana emergente. Permite popups para este sitio e intenta de nuevo.'
      if (code === 'auth/unauthorized-domain') msg = 'Este dominio no está autorizado en Firebase. Revisa la configuración de Authentication.'
      if (code === 'auth/invalid-api-key') msg = 'La clave de Firebase no es válida. Revisa el archivo .env.local.'
      if (code === 'auth/popup-closed-by-user') msg = 'Cerraste la ventana de inicio de sesión. Inténtalo de nuevo.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6 text-center">
        <div className="rounded-2xl bg-primary/10 p-5">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{nombreColegio}</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de análisis SIMCE</p>
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 w-full">
            {error}
          </p>
        )}
        <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión con Google'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Los datos se guardan en la nube asociados a tu cuenta Google.
        </p>
      </div>
    </div>
  )
}
