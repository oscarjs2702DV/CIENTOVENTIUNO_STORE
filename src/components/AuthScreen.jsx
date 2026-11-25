import { ArrowLeft, ArrowRight, Shield } from 'lucide-react'
import { useAuth } from '../store/authStore'
import { useUI } from '../store/uiStore'

export default function AuthScreen() {
  const signIn = useAuth((s) => s.signIn)
  const backToStore = useUI((s) => s.backToStore)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-5 text-center">
      <Shield size={40} className="text-grape" />
      <h1 className="font-display text-4xl uppercase tracking-widest2 text-white">Administración</h1>
      <p className="max-w-sm font-body text-chalk/70">
        Acceso exclusivo para el equipo. Recibirás un código en tu correo autorizado.
      </p>
      <button onClick={signIn} className="btn-primary flex items-center gap-2">
        Ingresar <ArrowRight size={18} />
      </button>
      <button onClick={backToStore} className="flex items-center gap-2 font-body text-sm text-chalk/60 hover:text-grape">
        <ArrowLeft size={16} /> Volver a la tienda
      </button>
    </div>
  )
}
