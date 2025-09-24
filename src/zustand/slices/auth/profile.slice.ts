import type { StateCreator } from "zustand"

export type Profile = {
  id: number
  name: string
  email: string
  avatar?: string
}

export type ProfileSlice = {
  user: Profile | null
  setUser: (user: Profile | null) => void
  updateUser: (patch: Partial<Profile>) => void
}

export const createProfileSlice: StateCreator<ProfileSlice, [], [], ProfileSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (patch) => set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
})


