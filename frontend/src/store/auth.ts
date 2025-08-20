import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

const useAuth = create<AuthState>((set) => ({
  token: (typeof window !== 'undefined') ? localStorage.getItem('token') : null,
  setToken: (t) => { if (t) localStorage.setItem('token', t); else localStorage.removeItem('token'); set({ token: t }) },
  logout: () => { localStorage.removeItem('token'); set({ token: null }) }
}))

export default useAuth
