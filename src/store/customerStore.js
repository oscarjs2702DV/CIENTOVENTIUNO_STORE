import { create } from 'zustand'
import {
  getCustomer, loginCustomer, logoutCustomer, registerCustomer,
  removeAvatar, updateProfile, uploadAvatar,
} from '../lib/api'
import { useToast } from './toastStore'
import { useCart } from './cartStore'

const GOOGLE_ERRORS = {
  'no-disponible': 'El acceso con Google todavía no está disponible.',
  cancelado: 'Cancelaste el acceso con Google.',
  'sin-correo': 'Tu cuenta de Google no tiene un correo verificado.',
  error: 'No se pudo entrar con Google. Inténtalo de nuevo.',
}

// Al volver de Google la dirección trae ?google=... (error) o ?bienvenida=...
// (todo bien); se leen una vez y se quitan de la barra.
function takeReturnParams() {
  const params = new URLSearchParams(window.location.search)
  const google = params.get('google')
  const welcome = params.get('bienvenida')
  if (google || welcome) window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  return {
    googleError: google ? GOOGLE_ERRORS[google] || GOOGLE_ERRORS.error : null,
    welcome,
  }
}

const back = takeReturnParams()
const firstName = (user) => user?.name?.split(' ')[0] || ''

export const useCustomer = create((set, get) => ({
  user: null,
  loading: true,
  googleAvailable: false,
  googleError: back.googleError,
  started: false,
  menuOpen: false,
  profileOpen: false,

  init: async () => {
    if (get().started) return
    set({ started: true })
    try {
      const { user, google } = await getCustomer()
      set({ user, googleAvailable: google, loading: false })
      if (user && back.welcome === 'nuevo') useToast.getState().success('Te has registrado correctamente')
      else if (user && back.welcome) useToast.getState().success(`Hola de nuevo${firstName(user) ? `, ${firstName(user)}` : ''}`)
    } catch {
      set({ user: null, loading: false })
    }
  },

  register: async (data) => {
    const { user } = await registerCustomer(data)
    set({ user })
    useToast.getState().success('Te has registrado correctamente')
  },
  signIn: async (data) => {
    const { user } = await loginCustomer(data)
    set({ user })
    useToast.getState().success(`Hola de nuevo${firstName(user) ? `, ${firstName(user)}` : ''}`)
  },
  signOut: async () => {
    await logoutCustomer()
    set({ user: null, menuOpen: false, profileOpen: false })
    useCart.getState().clear()
    useToast.getState().info('Cerraste sesión')
  },
  saveProfile: async (data) => set({ user: (await updateProfile(data)).user }),
  setAvatar: async (blob) => set({ user: (await uploadAvatar(blob)).user }),
  deleteAvatar: async () => set({ user: (await removeAvatar()).user }),

  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
  openProfile: () => set({ menuOpen: false, profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  clearGoogleError: () => set({ googleError: null }),
}))

// Edad cumplida a partir de la fecha AAAA-MM-DD.
export function ageFrom(birthDate) {
  if (!birthDate) return null
  const [y, m, d] = birthDate.split('-').map(Number)
  const now = new Date()
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return age
}
