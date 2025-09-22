import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { ApiError } from "@/utils/errors"

interface User {
  id: number
  name: string
  email: string
  role: "CUSTOMER" | "STAFF" | "ADMIN" 
  role_id: 4 | 3 | 1 
  avatar?: string
  created_at: string
  status: "active" | "inactive"
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<void>
  register: (userData: Omit<User, "id" | "created_at" | "status"> & { password: string }) => Promise<void>
  logout: () => void
  verifyAuth: () => Promise<void>
  clearError: () => void
  updateProfile: (profileData: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    devtools(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        login: async (email, password) => {
          set({ loading: true, error: null })
          
          try {
            const response = await bambiApi.post(
              API_ENDPOINTS.AUTH_LOGIN,
              { email, password },
              { skipAuth: true }
            )
            
            const { user, token, refresh_token } = response.data
            
            set({
              user,
              token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              loading: false,
            })

            localStorage.setItem("access_token", token)
            localStorage.setItem("refresh_token", refresh_token)

            toast.success("Đăng nhập thành công!", {
              description: `Chào ${user.name}!`,
            })

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Đăng nhập thất bại"
            
            set({ 
              loading: false, 
              error: message,
              isAuthenticated: false 
            })
            
            toast.error("Đăng nhập thất bại", {
              description: message,
            })
            
            throw error
          }
        },

        register: async (userData) => {
          set({ loading: true, error: null })
          
          try {
            const response = await bambiApi.post(
              API_ENDPOINTS.AUTH_REGISTER,
              userData,
              { skipAuth: true }
            )
            
            const { user, token, refresh_token } = response.data
            
            set({
              user,
              token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              loading: false,
            })

            localStorage.setItem("access_token", token)
            localStorage.setItem("refresh_token", refresh_token)

            toast.success("Đăng ký thành công!", {
              description: "Tài khoản của bạn đã được tạo",
            })

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Đăng ký thất bại"
            
            set({ 
              loading: false, 
              error: message 
            })
            
            toast.error("Đăng ký thất bại", {
              description: message,
            })
            
            throw error
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          })

          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")

          toast.success("Đăng xuất thành công!", {
            description: "Hẹn gặp lại!",
          })
        },

        verifyAuth: async () => {
          const token = localStorage.getItem("access_token")
          
          if (!token) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              loading: false 
            })
            return
          }

          set({ loading: true })

          try {
            const response = await bambiApi.get(API_ENDPOINTS.AUTH_ME)
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              loading: false,
            })

          } catch (error) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            })

            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")

            toast.warning("Phiên đăng nhập hết hạn", {
              description: "Vui lòng đăng nhập lại",
            })
          }
        },

        updateProfile: async (profileData) => {
          set({ loading: true, error: null })
          
          try {
            const response = await bambiApi.put(API_ENDPOINTS.PROFILE, profileData)
            
            set(state => ({
              user: state.user ? { ...state.user, ...response.data } : null,
              loading: false,
            }))

            toast.success("Cập nhật hồ sơ thành công!")

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Cập nhật thất bại"
            
            set({ loading: false, error: message })
            toast.error("Cập nhật thất bại", { description: message })
            
            throw error
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: "bambi-auth-storage",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)