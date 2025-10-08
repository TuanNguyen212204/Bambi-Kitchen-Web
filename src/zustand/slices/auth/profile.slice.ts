import type { StateCreator } from "zustand"
import type { ProfileSlice, User } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createProfileSlice: StateCreator<ProfileSlice, [], [], ProfileSlice> = (set, _get, _store) => ({
  user: null,
  loading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  updateUser: (patch) => set((state) => ({ 
    user: state.user ? { ...state.user, ...patch } : state.user 
  })),
  
  updateProfile: async (profileData) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const response = await bambiApi.put(API_ENDPOINTS.PROFILE, profileData)
      
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...(response.data as Partial<User>) } : null
        return {
          user: updatedUser,
          loading: false,
        }
      })

      const { toast } = await import("sonner")
      toast.success("Cập nhật hồ sơ thành công!")

    } catch (e) {
      const { ApiError } = await import("@utils/errors")
      const apiError = e as InstanceType<typeof ApiError>
      console.log(ApiError.name)
      const message = apiError.userFriendlyMessage || "Cập nhật thất bại"
      
      set({ loading: false, error: message })
      
      const { toast } = await import("sonner")
      toast.error("Cập nhật thất bại", { description: message })
      
      throw e
    }
  },
  
  clearError: () => set({ error: null }),
})


