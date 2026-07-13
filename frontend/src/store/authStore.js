import { create } from 'zustand'
import api from '../config/api.js'

const storedToken = localStorage.getItem('fleettrack_token')

const useAuthStore = create((set, get) => ({
  token: storedToken,
  user: null,
  isInitializing: Boolean(storedToken),
  setSession: ({ token, user }) => {
    localStorage.setItem('fleettrack_token', token)
    set({ token, user, isInitializing: false })
  },
  clearSession: () => {
    localStorage.removeItem('fleettrack_token')
    set({ token: null, user: null, isInitializing: false })
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    get().setSession(response.data.data)
  },
  acceptInvitation: async (payload) => {
    const response = await api.post('/auth/accept', payload)
    get().setSession(response.data.data)
  },
  logout: async () => {
    try { await api.post('/auth/logout') } finally { get().clearSession() }
  },
  bootstrap: async () => {
    if (!get().token) {
      set({ isInitializing: false })
      return
    }
    try {
      const response = await api.get('/auth/me')
      set({ user: response.data.data.user, isInitializing: false })
    } catch {
      get().clearSession()
    }
  },
}))

export default useAuthStore
