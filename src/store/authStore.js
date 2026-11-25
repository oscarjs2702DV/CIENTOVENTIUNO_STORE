import { create } from 'zustand'
import { getSession } from '../lib/api'

// Solo el administrador inicia sesión (Cloudflare Access). Los clientes no
// tienen cuenta, así que la tienda no consulta la sesión hasta que hace falta.
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

  signIn: () => window.location.assign('/api/admin/login'),
  signOut: () => window.location.assign('/cdn-cgi/access/logout'),
}))
