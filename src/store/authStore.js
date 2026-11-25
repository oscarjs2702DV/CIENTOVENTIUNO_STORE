import { create } from 'zustand'
import { getSession, login, logout } from '../lib/api'

// Solo el administrador inicia sesión. Los clientes no tienen cuenta, así que
// la tienda no consulta la sesión hasta que hace falta.
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
