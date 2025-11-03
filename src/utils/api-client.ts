import type { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestHeaders, AxiosRequestConfig } from "axios"
import { http } from "@utils/http"
import { ApiError, shouldToast } from "@utils/errors"
import { toast } from "sonner"
import { useAuthStore } from "@zustand/stores/auth"

export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string | undefined>
}

export interface RequestOptions extends Omit<AxiosRequestConfig, "baseURL" | "url" | "method"> {
  retry?: {
    maxRetries: number
    delayMs: number
  }
  skipAuth?: boolean
}

let redirectingToLogin = false

export class BambiApiClient {
  private client: AxiosInstance

  constructor(client: AxiosInstance = http) {
    this.client = client
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
        const { token } = useAuthStore.getState()

        if (!config.headers) {
          config.headers = {} as AxiosRequestHeaders
        }

        if (token && token !== "session-based" && !config.skipAuth) {
          ;(config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`
        }

        config.withCredentials = true
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
        }
        return response
      },
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number; skipAuth?: boolean }
        const status = error.response?.status
        
        // Lấy URL từ nhiều nguồn khác nhau vì có thể config.url là empty
        let url = (originalRequest?.url || "") as string
        if (!url && originalRequest?.baseURL) {
          // Nếu không có url, thử lấy từ baseURL
          url = originalRequest.baseURL
        }
        if (!url && (error as any).request?.responseURL) {
          // Thử lấy từ responseURL
          url = (error as any).request.responseURL
        }
        if (!url && (error as any).config?.url) {
          // Fallback: thử lấy trực tiếp từ error.config
          url = (error as any).config.url
        }
        
        // Thêm cách khác để nhận diện auth request: check skipAuth flag
        const skipAuth = originalRequest?.skipAuth === true

        // Chỉ check URL, nhưng cũng check skipAuth vì auth requests thường có skipAuth=true
        // URL có thể là absolute hoặc relative, cần check cả hai
        const normalizedUrl = url.toLowerCase()
        const isLoginRequest = normalizedUrl.includes("/user/login") || normalizedUrl.includes("/login") || (skipAuth && normalizedUrl === "")
        const isMeRequest = normalizedUrl.includes("/user/me") || normalizedUrl.includes("/api/user/me")
        const isRegisterRequest = normalizedUrl.includes("/register") || normalizedUrl.includes("/account/register")
        const isForgotPasswordRequest = normalizedUrl.includes("/forgot-password") || normalizedUrl.includes("/user/forgot-password")
        const isResetPasswordRequest = normalizedUrl.includes("/reset-password") || normalizedUrl.includes("/user/reset-password")
        
        const hasToken = !!useAuthStore.getState().token
        const hadSession = hasToken || useAuthStore.getState().isAuthenticated
        
        if (status === 401 && !isLoginRequest && !isMeRequest) {
          this.logout()
          redirectingToLogin = true
          
          if (hadSession) {
            try {
              const { toast } = await import("sonner")
              if (shouldToast("session_expired")) {
                toast.error("Phiên đăng nhập đã hết hạn", {
                  description: "Vui lòng đăng nhập lại để tiếp tục.",
                })
              }
            } catch { void 0 }
            setTimeout(() => {
              if (typeof window !== "undefined") window.location.href = "/login"
            }, 50)
          }
          return Promise.reject(new ApiError(error))
        }
        const looksLikeProtectedApi = url.startsWith("/api/")
        if ((status === 403 && hasToken && looksLikeProtectedApi && !isLoginRequest) ||
            (status === 500 && hasToken && /\/api\/notification\/to-account\//.test(url))) {
          this.logout()
          redirectingToLogin = true
          
          if (hadSession) {
            try {
              const { toast } = await import("sonner")
              if (shouldToast("session_expired_fallback")) {
                toast.error("Phiên làm việc không còn hiệu lực", {
                  description: "Vui lòng đăng nhập lại.",
                })
              }
            } catch { void 0 }
            setTimeout(() => {
              if (typeof window !== "undefined") window.location.href = "/login"
            }, 50)
          }
          return Promise.reject(new ApiError(error))
        }

        // KHÔNG BAO GIỜ toast cho auth requests, chỉ toast trong catch block của từng function
        // Nếu có skipAuth=true và URL empty, có thể đây là auth request (login/register thường có skipAuth)
        // Nhưng không dùng skipAuth alone vì có request khác cũng dùng skipAuth
        const isAuthRequest = isLoginRequest || isMeRequest || isRegisterRequest || isForgotPasswordRequest || isResetPasswordRequest || 
          (skipAuth && (normalizedUrl === "" || normalizedUrl.includes("/user/") || normalizedUrl.includes("/account/")))
        
        // Nếu là auth request, không toast trong interceptor (để tránh duplicate toast)
        if (isAuthRequest) {
          return Promise.reject(new ApiError(error))
        }
        
        // Kiểm tra silent header cho các request khác
        const silent = originalRequest?.headers && (
          (originalRequest.headers as AxiosRequestHeaders)["x-silent-error"] ||
          (originalRequest.headers as AxiosRequestHeaders)["X-Silent-Error"]
        )
        
        // Chỉ toast cho non-auth requests và không có silent header
        if (!silent && !redirectingToLogin) {
          // Tất cả lỗi đều dùng handleError để lấy message từ backend
          if (!(status === 401 && !isMeRequest && !isLoginRequest)) {
            this.handleError(error, hadSession)
          }
        }
        return Promise.reject(new ApiError(error))
      }
    )
  }


  private handleError(error: unknown, hadSession: boolean = false) {
    const err = error as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string }
    const status = err.response?.status
    // Lấy message từ field "error" (format mới của backend) hoặc "message" (format cũ)
    const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message
    
    // Chỉ hiển thị nếu có message từ backend
    if (!errorMessage) return
    
    // Dùng errorMessage để check duplicate thay vì chỉ dùng status (tránh toast duplicate cùng message)
    const toastKey = `error_${errorMessage}`
    if (!shouldToast(toastKey)) {
      return // Đã toast message này rồi, không toast lại
    }
    
    // Chỉ hiển thị message từ backend, không có title hardcode
    switch (status) {
      case 400:
      case 401:
      case 403:
      case 404:
      case 409:
      case 500:
        // Với 401 và đã có session, thêm action button
        if (status === 401 && hadSession) {
          toast.error(errorMessage, {
            action: { label: "Đăng nhập", onClick: () => window.location.href = "/login" },
          })
        } else {
          toast.error(errorMessage)
        }
        if (status === 403) {
          window.location.href = "/unauthorized"
        }
        break
      default:
        toast.error(errorMessage)
    }
  }

  private logout() {
    useAuthStore.getState().logout()
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, options)
    return { data: response.data, status: response.status, statusText: response.statusText, headers: response.headers as Record<string, string | undefined> }
  }

  async post<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, options)
    return { data: response.data, status: response.status, statusText: response.statusText, headers: response.headers as Record<string, string | undefined> }
  }

  async put<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, options)
    return { data: response.data, status: response.status, statusText: response.statusText, headers: response.headers as Record<string, string | undefined> }
  }

  async patch<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.patch<T>(url, data, options)
    return { data: response.data, status: response.status, statusText: response.statusText, headers: response.headers as Record<string, string | undefined> }
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, options)
    return { data: response.data, status: response.status, statusText: response.statusText, headers: response.headers as Record<string, string | undefined> }
  }
}

export const bambiApi = new BambiApiClient()


// Public client helpers: always skip auth header and avoid auth redirection side-effects
export const bambiPublicApi = {
  get: async function <T>(url: string, options?: RequestOptions) {
    return bambiApi.get<T>(url, { ...(options || {}), skipAuth: true })
  },
  post: async function <T, D = unknown>(url: string, data?: D, options?: RequestOptions) {
    return bambiApi.post<T, D>(url, data, { ...(options || {}), skipAuth: true })
  },
  put: async function <T, D = unknown>(url: string, data?: D, options?: RequestOptions) {
    return bambiApi.put<T, D>(url, data, { ...(options || {}), skipAuth: true })
  },
  patch: async function <T, D = unknown>(url: string, data?: D, options?: RequestOptions) {
    return bambiApi.patch<T, D>(url, data, { ...(options || {}), skipAuth: true })
  },
  delete: async function <T>(url: string, options?: RequestOptions) {
    return bambiApi.delete<T>(url, { ...(options || {}), skipAuth: true })
  }
}

