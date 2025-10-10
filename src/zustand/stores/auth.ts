import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import type { AuthStore } from "@/zustand/types"
import { 
  createSessionSlice, 
  createProfileSlice, 
  createUserSlice
} from "@/zustand/slices/auth"

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createSessionSlice(set, get, store),
        ...createProfileSlice(set, get, store),
        ...createUserSlice(set, get, store),
      }),
      {
        name: "bambi-auth-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state: AuthStore) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
)