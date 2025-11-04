import type { StateCreator } from "zustand"
import type { SessionSlice, UserMeResponse } from "@/zustand/types"

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  // Đánh dấu khi user đã được đồng bộ đầy đủ từ /me
  userHydrated: false,
  
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
    // Reset transient auth state at the beginning to avoid stale user from previous session
    set({ loading: true, error: null, user: null, isAuthenticated: false, userHydrated: false })
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const loginRes = await bambiApi.post<string>(
        API_ENDPOINTS.AUTH_LOGIN,
        { username: phone, password },
        { 
          skipAuth: true,
          headers: { 'x-silent-error': '1' } // Tắt toast tự động trong interceptor, chỉ toast trong catch block
        }
      )

      const accessToken = loginRes.data
      // Ghi đè token cũ trước để interceptor dùng ngay
      set({ token: accessToken, refreshToken: null, isAuthenticated: true })

      // Thiết lập tạm thời user từ payload JWT để tránh chớp nháy/nhầm phiên cũ
      try {
        const base64 = accessToken.split(".")[1]
        const json = JSON.parse(atob(base64)) as { sub?: string; name?: string; email?: string; roles?: string[] }
        if (import.meta.env.DEV) {
          console.log("[Auth] JWT roles:", json?.roles, "sub:", json?.sub)
        }
        if (json?.sub) {
          const role = (Array.isArray(json.roles) && json.roles[0] ? json.roles[0] : "USER") as "ADMIN" | "STAFF" | "USER"
          const tempUser = {
            id: Number(json.sub),
            name: (json.name as string) || "",
            email: (json.email as string) || "",
            role,
            role_id: (role === "ADMIN" ? 1 : role === "STAFF" ? 3 : 4) as 1 | 3 | 4,
          }
          set({ user: tempUser })
        }
      } catch { /* ignore decode errors */ }
      
      // Đợi một chút để ensure token được persist và interceptor có thể đọc được
      // Zustand persist là async, cần đợi để tránh race condition
      await new Promise(resolve => setTimeout(resolve, 50))

      // Nếu login thành công, gọi /me request với token đã được set
      const userResponse = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME, {
        headers: { 
          'x-silent-error': '1', // Tắt toast tự động cho /me request
          'Authorization': `Bearer ${accessToken}` // Đảm bảo token được set vào header
        }
      })
      const userMe = userResponse.data
      if (import.meta.env.DEV) {
        console.log("[Auth] /me:", userMe)
      }
      // So khớp role giữa JWT và /me, ưu tiên vai trò THẤP HƠN để tránh escalate quyền do cookie phiên cũ trên server
      const tokenStr = get().token || ""
      let tokenRole: "USER" | "ADMIN" | "STAFF" | null = null
      let tokenSub: number | null = null
      try {
        const base64Payload = tokenStr.split(".")[1]
        const json = JSON.parse(atob(base64Payload)) as { sub?: string; roles?: string[] }
        const rawRole = (Array.isArray(json.roles) && json.roles[0]) || "USER"
        const normalized = String(rawRole).replace(/^ROLE_/i, "") as "USER" | "ADMIN" | "STAFF"
        tokenRole = (normalized === "ADMIN" || normalized === "STAFF" || normalized === "USER") ? normalized : "USER"
        tokenSub = json?.sub ? Number(json.sub) : null
      } catch { /* ignore */ }

      const meRole = (userMe.role || "USER") as "USER" | "ADMIN" | "STAFF"
      const rank = (r: "USER" | "STAFF" | "ADMIN") => (r === "ADMIN" ? 3 : r === "STAFF" ? 2 : 1)
      const resolvedRole = tokenRole ? (rank(meRole) < rank(tokenRole) ? meRole : tokenRole) : meRole
      const resolvedId = (tokenRole && tokenRole !== meRole && tokenSub) ? tokenSub : userMe.id

      const user = {
        id: resolvedId,
        name: userMe.name,
        role: resolvedRole,
        email: userMe.mail,
        role_id: (resolvedRole === "ADMIN" ? 1 : resolvedRole === "STAFF" ? 3 : 4) as 1 | 3 | 4,
      }

      set({ user, userHydrated: true, loading: false })

      const { toast } = await import("sonner")
      toast.success("Đăng nhập thành công!")

    } catch (error) {
      // Chỉ toast 1 lần duy nhất cho login error (cả login request và /me request fail đều vào đây)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error)

      set({ 
        loading: false, 
        error: message,
        isAuthenticated: false,
        userHydrated: false 
      })

      // Chỉ hiển thị message từ backend, không có title hardcode
      // Dùng shouldToast với message để tránh duplicate toast
      const toastKey = `login_${message}`
      const canToast = message && message !== "Đã xảy ra lỗi không xác định" && shouldToast(toastKey)
      
      if (canToast) {
        const { toast } = await import("sonner")
        toast.error(message)
      }

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
        { 
          skipAuth: true,
          headers: { 'x-silent-error': '1' } // Tắt toast tự động trong interceptor, chỉ toast trong catch block
        }
      )
      
      set({ loading: false })

      const { toast } = await import("sonner")
      toast.success("Đăng ký thành công!", {
        description: "Vui lòng đăng nhập để tiếp tục.",
      })

    } catch (error) {
      const { extractErrorMessage } = await import("@utils/errors")
      const message = extractErrorMessage(error)
      
      set({ 
        loading: false, 
        error: message 
      })
      
      // Chỉ hiển thị message từ backend, không có title hardcode
      const { toast } = await import("sonner")
      toast.error(message)
      
      throw error
    }
  },

  logout: async () => {
    const currentState = get()
    const hadSession = !!currentState.token || currentState.isAuthenticated
    
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

    if (hadSession) {
      const toastModule = await import("sonner")
      toastModule.toast.success("Đăng xuất thành công!", {
        description: "Hẹn gặp lại!",
      })
    }
  },

  verifyAuth: async () => {
    const currentState = get()
    const hadToken = !!currentState.token || currentState.isAuthenticated
    
    // Nếu đã có user và token, không cần verify lại (tránh race condition sau khi login)
    if (currentState.user && currentState.token && currentState.token !== "session-based") {
      return
    }
    
    set({ loading: true, userHydrated: false })

    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const me = await bambiApi.get<UserMeResponse>(API_ENDPOINTS.AUTH_ME)
      
      // Không ghi đè token (tránh gán "session-based" làm hỏng Authorization header)
      set((state) => ({
        token: state.token,
        isAuthenticated: true,
        loading: false,
        // Nếu chưa có user (VD refresh trang), đồng bộ user dựa trên /me
        user: state.user || (me.data ? {
          id: me.data.id,
          name: me.data.name,
          role: (me.data.role || "USER") as "USER" | "ADMIN" | "STAFF",
          email: me.data.mail,
          role_id: ((me.data.role || "USER") === "ADMIN" ? 1 : (me.data.role === "STAFF" ? 3 : 4)) as 1 | 3 | 4,
        } : state.user),
        userHydrated: true,
      }))

    } catch {
      set({
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        userHydrated: false,
      })

      if (hadToken) {
        const { toast } = await import("sonner")
        toast.warning("Phiên đăng nhập hết hạn", {
          description: "Vui lòng đăng nhập lại",
        })
      }
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

      const { extractErrorMessage } = await import("@utils/errors")
      const message = extractErrorMessage(error)

      set({ 
        loading: false, 
        error: message 
      })
      
      // Chỉ hiển thị message từ backend, không có title hardcode
      const { toast } = await import("sonner")
      toast.error(message)
      
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
      const { extractErrorMessage } = await import("@utils/errors")
      const message = extractErrorMessage(error)
      
      set({ 
        loading: false, 
        error: message 
      })
      
      // Chỉ hiển thị message từ backend, không có title hardcode
      const { toast } = await import("sonner")
      toast.error(message)
      
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
      const { extractErrorMessage } = await import("@utils/errors")
      const message = extractErrorMessage(error)
      
      set({ 
        loading: false, 
        error: message 
      })
      
      // Chỉ hiển thị message từ backend, không có title hardcode
      const { toast } = await import("sonner")
      toast.error(message)
      
      throw error
    }
  },
})


