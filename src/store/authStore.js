import { create } from 'zustand'
import { getSession, login, logout } from '../lib/api'

// Sesión del administrador (clave privada en /admin). Los clientes usan
// customerStore.
export const useAuth = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    set({ loading: true })
    try {
      set({ user: await getSession(), loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  signIn: async (key) => set({ user: await login(key) }),

  signOut: async () => {
    await logout()
    set({ user: null })
  },
}))
