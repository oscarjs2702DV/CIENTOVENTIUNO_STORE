import { useEffect, useRef } from 'react'
import { Cake, LogOut, Settings, User } from 'lucide-react'
import { ageFrom, useCustomer } from '../store/customerStore'

export function Avatar({ user, size = 40, className = '' }) {
  const style = { width: size, height: size }
  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={style} className={`rounded-full object-cover ${className}`} />
  }
  const initial = user?.name?.trim()?.[0]?.toUpperCase()
  return (
    <span style={style} className={`flex items-center justify-center rounded-full bg-plum/60 font-display text-grape ${className}`}>
      {initial ? <span style={{ fontSize: size * 0.45 }}>{initial}</span> : <User size={size * 0.5} />}
    </span>
  )
}

// Ventana pequeña que se abre bajo el ícono de usuario del encabezado.
export default function AccountMenu({ anchorRef }) {
  const { user, menuOpen, closeMenu, openProfile, signOut } = useCustomer()
  const panel = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (panel.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      closeMenu()
    }
    const onKey = (e) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, closeMenu, anchorRef])

  if (!menuOpen || !user) return null
  const age = ageFrom(user.birthDate)

  return (
    <div ref={panel} role="dialog" aria-label="Mi cuenta"
      className="fixed right-4 top-20 z-[60] w-[min(18rem,calc(100vw-2rem))] border border-white/10 bg-ink/95 p-5 shadow-2xl animate-fadeIn sm:absolute sm:right-0 sm:top-full sm:mt-3">
      <div className="flex items-start gap-3">
        <Avatar user={user} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl uppercase tracking-widest2 text-white">{user.name || 'Mi cuenta'}</p>
          <p className="truncate font-body text-sm text-chalk/60">{user.email}</p>
        </div>
        <button onClick={openProfile} aria-label="Configurar perfil" title="Configurar perfil"
          className="rounded-full p-1.5 text-chalk/70 transition-colors hover:bg-white/10 hover:text-grape">
          <Settings size={20} />
        </button>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 font-body text-sm text-chalk/70">
        <p className="flex items-center gap-2">
          <Cake size={16} className="text-grape" />
          {age != null ? `${age} años` : (
            <button onClick={openProfile} className="text-grape underline-offset-2 hover:underline">
              Añade tu fecha de nacimiento
            </button>
          )}
        </p>
        {user.google && <p className="text-xs text-chalk/40">Entras con Google</p>}
      </div>

      <button onClick={signOut}
        className="mt-4 flex w-full items-center justify-center gap-2 border border-white/15 py-2 font-display text-base uppercase tracking-widest2 text-chalk transition-colors hover:border-grape hover:text-white">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  )
}
