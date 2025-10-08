import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import type { AuthStore, User } from "@/zustand/types"
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
        
        login: async (phone: string, password: string) => {
          set({ loading: true, error: null })
          
          try {
            const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
            const formData = new FormData()
            formData.append('username', phone)
            formData.append('password', password)
            
            await bambiApi.post<unknown>(
              API_ENDPOINTS.AUTH_LOGIN,
              formData,
              { 
                skipAuth: true,
                headers: {}
              }
            )
            
            const user = await get().loadUserData()
            
            set({
              user,
              token: "session-based",
              refreshToken: null,
              isAuthenticated: true,
              loading: false,
            })

            const { toast } = await import("sonner")
            toast.success("Đăng nhập thành công!", {
              description: user ? `Chào ${user.name}!` : "Chào bạn!",
            })

          } catch (error) {
            const { ApiError } = await import("@utils/errors")
            const apiError = error as InstanceType<typeof ApiError>
            console.log(ApiError.name)
            const isUnauthorized = apiError.status === 401
            const message = isUnauthorized ? "Số điện thoại hoặc mật khẩu không đúng" : (apiError.userFriendlyMessage || "Đăng nhập thất bại")

            set({ 
              loading: false, 
              error: message,
              isAuthenticated: false 
            })

            const { toast } = await import("sonner")
            toast.error("Đăng nhập thất bại", {
              description: message,
            })

            throw error
          }
        },
        
        register: async (userData: unknown) => {
          set({ loading: true, error: null })
          
          try {
            const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
            const response = await bambiApi.post(
              API_ENDPOINTS.AUTH_REGISTER,
              userData,
              { skipAuth: true }
            )
            
            const { user, token, refresh_token } = response.data as { user: unknown; token: string; refresh_token: string }
            
            set({
              user: user as User,
              token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              loading: false,
            })

            localStorage.setItem("access_token", token)
            localStorage.setItem("refresh_token", refresh_token)

            const { toast } = await import("sonner")
            toast.success("Đăng ký thành công!", {
              description: "Tài khoản của bạn đã được tạo",
            })

          } catch (error) {
            const { ApiError } = await import("@utils/errors")
            const apiError = error as InstanceType<typeof ApiError>
            console.log(ApiError.name)
            const message = apiError.userFriendlyMessage || "Đăng ký thất bại"
            
            set({ 
              loading: false, 
              error: message 
            })
            
            const { toast } = await import("sonner")
            toast.error("Đăng ký thất bại", {
              description: message,
            })
            
            throw error
          }
        },
        
        verifyAuth: async () => {
          set({ loading: true })

          try {
            const user = await get().loadUserData()
            
            set({
              user,
              token: "session-based",
              isAuthenticated: true,
              loading: false,
            })

          } catch {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              loading: false,
            })

            const { toast } = await import("sonner")
            toast.warning("Phiên đăng nhập hết hạn", {
              description: "Vui lòng đăng nhập lại",
            })
          }
        },
        
        logout: async () => {
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

          const toastModule = await import("sonner")
          toastModule.toast.success("Đăng xuất thành công!", {
            description: "Hẹn gặp lại!",
          })
        },
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