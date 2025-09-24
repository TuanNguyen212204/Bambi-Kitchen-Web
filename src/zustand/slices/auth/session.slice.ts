import type { StateCreator } from "zustand"

export type SessionSlice = {
  token: string | null
  isAuthenticated: boolean
  setSession: (token: string | null) => void
  clearSession: () => void
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
  token: null,
  isAuthenticated: false,
  setSession: (token) => set({ token, isAuthenticated: !!token }),
  clearSession: () => set({ token: null, isAuthenticated: false }),
})


