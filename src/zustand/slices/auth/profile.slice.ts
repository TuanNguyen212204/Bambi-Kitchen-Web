import type { StateCreator } from "zustand"
import type { ProfileSlice } from "@/zustand/types"

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
        const accountData = response.data as {
          id: number;
          name: string;
          mail: string;
          phone?: string;
          role: "USER" | "STAFF" | "ADMIN";
          active: boolean;
        }
        const updatedUser = state.user ? { 
          ...state.user, 
          email: accountData.mail || state.user.email,
          phone: accountData.phone || state.user.phone,
          name: accountData.name || state.user.name,
          role: accountData.role || state.user.role,
          status: accountData.active ? 'active' as const : 'inactive' as const
        } : null
        return {
          user: updatedUser,
          loading: false,
        }
      })

      const { toast } = await import("sonner")
      toast.success("Cập nhật hồ sơ thành công!")

    } catch (e) {
      const { extractErrorMessage } = await import("@utils/errors")
      const message = extractErrorMessage(e)
      
      set({ loading: false, error: message })
      
      // Chỉ hiển thị message từ backend, không có title hardcode
      const { toast } = await import("sonner")
      toast.error(message)
      
      throw e
    }
  },
  
  clearError: () => set({ error: null }),
})


