import type { StateCreator } from "zustand"
import type { SessionSlice, UserMeResponse } from "@/zustand/types"

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  setSession: (token, refreshToken = null) => set({ 
    token, 
    refreshToken, 
    isAuthenticated: !!token 
  }),
  
  clearSession: () => set({ 
    token: null, 
    refreshToken: null, 
    isAuthenticated: false 
  }),
  
  login: async (phone, password) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const loginRes = await bambiApi.post<string>(
        API_ENDPOINTS.AUTH_LOGIN,
        { username: phone, password },
        { skipAuth: true }
      )

      const accessToken = loginRes.data
      set({ token: accessToken, refreshToken: null, isAuthenticated: true, loading: false })

      const userResponse = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
      const userMe = userResponse.data
      const normalizedRole = (userMe.role || "USER") as "USER" | "ADMIN" | "STAFF"
      const user = {
        id: userMe.id,
        name: userMe.name,
        role: normalizedRole,
        email: userMe.mail,
        role_id: normalizedRole === "ADMIN" ? 1 : normalizedRole === "STAFF" ? 3 : 4,
      }

      set({ user } as any)

      const { toast } = await import("sonner")
      toast.success("Đăng nhập thành công!")

    } catch (error) {
      const apiError = error as { status?: number; userFriendlyMessage?: string }
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

  register: async (userData) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.post(
        API_ENDPOINTS.AUTH_REGISTER,
        userData,
        { skipAuth: true }
      )
      
      set({ loading: false })

      const { toast } = await import("sonner")
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng đăng nhập để tiếp tục.",
      })

    } catch (error) {
      const apiError = error as { userFriendlyMessage?: string }
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

  logout: async () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    } as any)

    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")

    const toastModule = await import("sonner")
    toastModule.toast.success("Đăng xuất thành công!", {
      description: "Hẹn gặp lại!",
    })
  },

  verifyAuth: async () => {
    set({ loading: true })

    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.get(API_ENDPOINTS.AUTH_ME)
      
      set({
        token: "session-based",
        isAuthenticated: true,
        loading: false,
      })

    } catch {
      set({
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

  forgotPassword: async (email: string) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.get(
        API_ENDPOINTS.AUTH_FORGOT_PASSWORD,
        { skipAuth: true, withCredentials: false, timeout: 60000, params: { email } }
      )
      
      set({ loading: false })
      
      const { toast } = await import("sonner")
      toast.success("Mã xác nhận đã được gửi!", {
        description: `Vui lòng kiểm tra email ${email}`,
      })

    } catch (error) {
      const err = error as { code?: string; message?: string; userFriendlyMessage?: string }
      if (err.code === "ECONNABORTED" || (err.message && err.message.includes("timeout"))) {
        set({ loading: false })
        const { toast } = await import("sonner")
        toast.success("Mã xác nhận đã được gửi!", {
          description: `Vui lòng kiểm tra email ${email}`,
        })
        return
      }

      const message = err.userFriendlyMessage || "Không thể gửi mã xác nhận"

      set({ 
        loading: false, 
        error: message 
      })
      
      const { toast } = await import("sonner")
      toast.error("Gửi mã xác nhận thất bại", {
        description: message,
      })
      
      throw error
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.post(
        API_ENDPOINTS.AUTH_VERIFY_OTP,
        null,
        {
          params: { email, otp },
          skipAuth: true
        }
      )
      
      set({ loading: false })
      
      const { toast } = await import("sonner")
      toast.success("Mã xác nhận hợp lệ!")
      return true

    } catch (error) {
      const apiError = error as { userFriendlyMessage?: string }
      const message = apiError.userFriendlyMessage || "Mã xác nhận không đúng hoặc đã hết hạn"
      
      set({ 
        loading: false, 
        error: message 
      })
      
      const { toast } = await import("sonner")
      toast.error("Xác thực mã thất bại", {
        description: message,
      })
      
      return false
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    set({ loading: true, error: null })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.post(
        API_ENDPOINTS.AUTH_RESET_PASSWORD,
        null,
        {
          params: { email, otp, newPassword },
          skipAuth: true
        }
      )
      
      set({ loading: false })
      
      const { toast } = await import("sonner")
      toast.success("Đặt lại mật khẩu thành công!", {
        description: "Bạn có thể đăng nhập với mật khẩu mới",
      })

    } catch (error) {
      const apiError = error as { userFriendlyMessage?: string }
      const message = apiError.userFriendlyMessage || "Không thể đặt lại mật khẩu"
      
      set({ 
        loading: false, 
        error: message 
      })
      
      const { toast } = await import("sonner")
      toast.error("Đặt lại mật khẩu thất bại", {
        description: message,
      })
      
      throw error
    }
  },
})


