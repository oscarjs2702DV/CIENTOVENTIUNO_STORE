import { useEffect, useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { useCustomer } from '../store/customerStore'
import { useUI } from '../store/uiStore'

const field =
  'w-full border border-white/15 bg-plum/20 px-3 py-2.5 font-body text-white placeholder:text-chalk/30 focus:border-grape focus:outline-none'

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function SignedOut() {
  const { register, signIn, googleAvailable, googleError, clearGoogleError } = useCustomer()
  const [mode, setMode] = useState('ingresar')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const isRegister = mode === 'registro'
  const shownError = error || googleError

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const switchMode = (m) => { setMode(m); setError(null); clearGoogleError() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    clearGoogleError()
    setSending(true)
    try {
      if (isRegister) await register(form)
      else await signIn({ email: form.email, password: form.password })
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center font-display text-4xl uppercase tracking-widest2 text-white">
        {isRegister ? 'Crear cuenta' : 'Ingresar'}
      </h1>

      <div role="tablist" className="mt-8 grid grid-cols-2 border border-white/15">
        {[['ingresar', 'Ingresar'], ['registro', 'Crear cuenta']].map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
            className={`py-2.5 font-display text-base uppercase tracking-widest2 transition-colors ${
              mode === m ? 'bg-grape text-white' : 'text-chalk/60 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {googleAvailable ? (
        <a href="/api/cuenta/google"
          className="mt-6 flex w-full items-center justify-center gap-3 bg-white px-4 py-3 font-body font-medium text-ink transition-opacity hover:opacity-90">
          <GoogleLogo /> Continuar con Google
        </a>
      ) : (
        <p className="mt-6 flex items-center justify-center gap-3 border border-white/10 px-4 py-3 font-body text-sm text-chalk/40">
          <GoogleLogo /> Acceso con Google: muy pronto
        </p>
      )}

      <div className="my-6 flex items-center gap-3 font-body text-xs uppercase tracking-widest2 text-chalk/40">
        <span className="h-px flex-1 bg-white/10" /> o con tu correo <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <div>
            <label htmlFor="nombre" className="mb-1.5 block font-body text-sm text-chalk/70">Nombre</label>
            <input id="nombre" name="name" autoComplete="name" required maxLength={80}
              value={form.name} onChange={change} className={field} />
          </div>
        )}
        <div>
          <label htmlFor="correo" className="mb-1.5 block font-body text-sm text-chalk/70">Correo</label>
          <input id="correo" name="email" type="email" autoComplete="email" required maxLength={254}
            value={form.email} onChange={change} className={field} />
        </div>
        <div>
          <label htmlFor="contrasena" className="mb-1.5 block font-body text-sm text-chalk/70">Contraseña</label>
          <input id="contrasena" name="password" type="password" required minLength={isRegister ? 8 : 1} maxLength={128}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password} onChange={change} className={field} />
          {isRegister && <p className="mt-1.5 font-body text-xs text-chalk/40">Mínimo 8 caracteres.</p>}
        </div>
        {shownError && <p role="alert" className="font-body text-sm text-red-300">{shownError}</p>}
        <button type="submit" disabled={sending} className="btn-primary mt-2 w-full disabled:opacity-50">
          {isRegister ? <Mail size={18} /> : null}
          {sending ? 'Un momento...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          {!isRegister && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  )
}

export default function AccountScreen() {
  const { user, loading } = useCustomer()
  const backToStore = useUI((s) => s.backToStore)
  // Con sesión abierta no hace falta esta pantalla: se vuelve a la tienda y
  // el aviso pequeño de arriba confirma el ingreso.
  useEffect(() => { if (!loading && user) backToStore() }, [loading, user, backToStore])
  return (
    <section className="flex min-h-screen items-center justify-center bg-ink px-5 pb-24 pt-32">
      {loading || user ? (
        <p className="font-display text-2xl uppercase tracking-widest2 text-chalk/50">Cargando...</p>
      ) : <SignedOut />}
    </section>
  )
}
