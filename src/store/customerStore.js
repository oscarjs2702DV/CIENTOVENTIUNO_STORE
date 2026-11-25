import { create } from 'zustand'
import { getCustomer, loginCustomer, logoutCustomer, registerCustomer } from '../lib/api'

const GOOGLE_ERRORS = {
  'no-disponible': 'El acceso con Google todavía no está disponible.',
  cancelado: 'Cancelaste el acceso con Google.',
  'sin-correo': 'Tu cuenta de Google no tiene un correo verificado.',
  error: 'No se pudo entrar con Google. Inténtalo de nuevo.',
}

// Al volver de Google con un error, la dirección trae ?google=...; se lee una
// vez y se quita de la barra.
function takeGoogleError() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('google')
  if (!code) return null
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  return GOOGLE_ERRORS[code] || GOOGLE_ERRORS.error
}

export const useCustomer = create((set, get) => ({
  user: null,
  loading: true,
  googleAvailable: false,
  googleError: takeGoogleError(),
  started: false,

  init: async () => {
    if (get().started) return
    set({ started: true })
    try {
      const { user, google } = await getCustomer()
      set({ user, googleAvailable: google, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  register: async (data) => set({ user: (await registerCustomer(data)).user }),
  signIn: async (data) => set({ user: (await loginCustomer(data)).user }),
  signOut: async () => {
    await logoutCustomer()
    set({ user: null })
  },
  clearGoogleError: () => set({ googleError: null }),
}))
