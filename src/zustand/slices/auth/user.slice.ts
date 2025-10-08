import type { StateCreator } from "zustand"
import type { UserSlice, User, UserMeResponse } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (_set, _get, _store) => ({
  loadUserData: async () => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const response = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
      const userMe = response.data

      const roleAuthority = userMe.role?.[0]?.authority?.replace("ROLE_", "") || "USER"
      const user: User = {
        id: userMe.userId,
        name: userMe.name,
        role: roleAuthority as "USER" | "ADMIN" | "STAFF",
        email: undefined, 
        role_id: userMe.role?.[0]?.authority === "ROLE_ADMIN" ? 1 : 
                 userMe.role?.[0]?.authority === "ROLE_STAFF" ? 3 : 4
      }

      return user
    } catch (error) {
      console.error("Failed to load user data:", error)
      return null
    }
  }
})
