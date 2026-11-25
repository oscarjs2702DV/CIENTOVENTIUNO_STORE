import { useState } from 'react'
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react'
import { useAuth } from '../store/authStore'
import { useUI } from '../store/uiStore'

export default function AuthScreen() {
  const signIn = useAuth((s) => s.signIn)
  const backToStore = useUI((s) => s.backToStore)
  const [key, setKey] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await signIn(key)
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-5 text-center">
      <Shield size={40} className="text-grape" />
      <h1 className="font-display text-4xl uppercase tracking-widest2 text-white">Administración</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        {/* Permite que el gestor de contraseñas guarde la clave. */}
        <input type="text" name="username" autoComplete="username" value="administrador" readOnly hidden />
        <label htmlFor="clave" className="text-left font-body text-sm text-chalk/70">Clave de acceso</label>
        <input id="clave" name="password" type="password" autoComplete="current-password" required autoFocus
          value={key} onChange={(e) => setKey(e.target.value)}
          className="w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white focus:border-grape focus:outline-none" />
        {error && <p role="alert" className="font-body text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={sending} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          {sending ? 'Ingresando...' : 'Ingresar'} <ArrowRight size={18} />
        </button>
      </form>
      <button onClick={backToStore} className="flex items-center gap-2 font-body text-sm text-chalk/60 hover:text-grape">
        <ArrowLeft size={16} /> Volver a la tienda
      </button>
    </div>
  )
}
