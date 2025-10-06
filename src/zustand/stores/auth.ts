import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { devtools } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { ApiError } from "@utils/errors"
import type { AuthState, User, AuthResponse, UserMeResponse } from "@/zustand/types"

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        login: async (phone, password) => {
          set({ loading: true, error: null })
          
          try {
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

            await new Promise(resolve => setTimeout(resolve, 100))
            
            const userResponse = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
            const userMe = userResponse.data

            const roleAuthority = userMe.role?.[0]?.authority?.replace("ROLE_", "") || "USER"
            const user: User = {
              id: userMe.userId,
              name: userMe.name,
              role: roleAuthority as "USER" | "ADMIN" | "STAFF",
              email: undefined, 
              role_id: userMe.role?.[0]?.authority === "ROLE_ADMIN" ? 1 : 
                       userMe.role?.[0]?.authority === "ROLE_STAFF" ? 3 : 4
            }
            
            set({
              user,
              token: "session-based",
              refreshToken: null,
              isAuthenticated: true,
              loading: false,
            })

            toast.success("Đăng nhập thành công!", {
              description: `Chào ${user.name}!`,
            })

          } catch (error) {
            const apiError = error as ApiError
            const isUnauthorized = apiError.status === 401
            const message = isUnauthorized ? "Số điện thoại hoặc mật khẩu không đúng" : (apiError.userFriendlyMessage || "Đăng nhập thất bại")

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
            const response = await bambiApi.post<AuthResponse>(
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
          set({ loading: true })

          try {
            const response = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
            const userMe = response.data
            const roleAuthority = userMe.role[0]?.authority.replace("ROLE_", "") || "USER"
            const user: User = {
              id: userMe.userId,
              name: userMe.name,
              role: roleAuthority as "USER" | "ADMIN" | "STAFF",
              email: undefined,
              role_id: userMe.role[0]?.authority === "ROLE_ADMIN" ? 1 : 
                       userMe.role[0]?.authority === "ROLE_STAFF" ? 3 : 4
            }
            
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
              isAuthenticated: false,
              loading: false,
            })

            toast.warning("Phiên đăng nhập hết hạn", {
              description: "Vui lòng đăng nhập lại",
            })
          }
        },

        updateProfile: async (profileData) => {
          set({ loading: true, error: null })
          
          try {
            const response = await bambiApi.put(API_ENDPOINTS.PROFILE, profileData)
            
            set((state) => {
              const updatedUser = state.user ? { ...state.user, ...(response.data as Partial<User>) } : null
              return {
                user: updatedUser,
                loading: false,
              }
            })

            toast.success("Cập nhật hồ sơ thành công!")

          } catch (e) {
            const apiError = e as ApiError
            const message = apiError.userFriendlyMessage || "Cập nhật thất bại"
            
            set({ loading: false, error: message })
            toast.error("Cập nhật thất bại", { description: message })
            
            throw e
          }
        },

        clearError: () => set({ error: null }),
        forgotPassword: async (email: string) => {
          set({ loading: true, error: null })
          
          try {
            await bambiApi.get(
              `${API_ENDPOINTS.AUTH_FORGOT_PASSWORD}?email=${encodeURIComponent(email)}`,
              { skipAuth: true }
            )
            
            set({ loading: false })
            
            toast.success("Mã xác nhận đã được gửi!", {
              description: `Vui lòng kiểm tra email ${email}`,
            })

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Không thể gửi mã xác nhận"
            
            set({ 
              loading: false, 
              error: message 
            })
            
            toast.error("Gửi mã xác nhận thất bại", {
              description: message,
            })
            
            throw error
          }
        },

        verifyOtp: async (email: string, otp: string) => {
          set({ loading: true, error: null })
          
          try {
            await bambiApi.post(
              API_ENDPOINTS.AUTH_VERIFY_OTP,
              null,
              {
                params: { email, otp },
                skipAuth: true
              }
            )
            
            set({ loading: false })
            
            toast.success("Mã xác nhận hợp lệ!")
            return true

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Mã xác nhận không đúng hoặc đã hết hạn"
            
            set({ 
              loading: false, 
              error: message 
            })
            
            toast.error("Xác thực mã thất bại", {
              description: message,
            })
            
            return false
          }
        },

        resetPassword: async (email: string, otp: string, newPassword: string) => {
          set({ loading: true, error: null })
          
          try {
            await bambiApi.post(
              API_ENDPOINTS.AUTH_RESET_PASSWORD,
              null,
              {
                params: { email, otp, newPassword },
                skipAuth: true
              }
            )
            
            set({ loading: false })
            
            toast.success("Đặt lại mật khẩu thành công!", {
              description: "Bạn có thể đăng nhập với mật khẩu mới",
            })

          } catch (error) {
            const apiError = error as ApiError
            const message = apiError.userFriendlyMessage || "Không thể đặt lại mật khẩu"
            
            set({ 
              loading: false, 
              error: message 
            })
            
            toast.error("Đặt lại mật khẩu thất bại", {
              description: message,
            })
            
            throw error
          }
        },
      }),
      {
        name: "bambi-auth-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state: AuthState) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
)