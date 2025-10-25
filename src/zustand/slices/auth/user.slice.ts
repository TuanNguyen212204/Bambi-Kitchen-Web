import type { StateCreator } from "zustand"
import type { UserSlice, User, UserMeResponse } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (_set, _get, _store) => ({
  loadUserData: async () => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const response = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
      const userMe = response.data

      const normalizedRole = (userMe.role || "USER") as "USER" | "ADMIN" | "STAFF"
      const user: User = {
        id: userMe.id,
        name: userMe.name,
        role: normalizedRole,
        email: userMe.mail,
        role_id: normalizedRole === "ADMIN" ? 1 : normalizedRole === "STAFF" ? 3 : 4
      }

      return user
    } catch (error) {
      console.error("Failed to load user data:", error)
      return null
    }
  }
})
