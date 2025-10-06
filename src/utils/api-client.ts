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

        if (token && token !== "session-based" && !config.skipAuth) {
          config.headers = (config.headers ?? {}) as AxiosRequestHeaders
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
        const url = (originalRequest?.url || "") as string

        const isLoginRequest = url.includes("/login") || originalRequest?.skipAuth
        if (status === 401 && !isLoginRequest) {
          this.logout()
        }

        const silent = originalRequest?.headers && (originalRequest.headers as AxiosRequestHeaders)["x-silent-error"]
        if (!silent) {
          if (url.includes("/api/ingredient/search")) {
            if (shouldToast("search_error")) {
              toast.error("Tìm kiếm thất bại")
            }
          } else if (!(status === 401 && isLoginRequest)) {
            this.handleError(error)
          }
        }
        return Promise.reject(new ApiError(error))
      }
    )
  }


  private handleError(error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const status = err.response?.status
    const message = err.response?.data?.message || err.message || "Có lỗi xảy ra"

    switch (status) {
      case 401:
        if (shouldToast("401")) toast.error("Phiên đăng nhập hết hạn", {
          description: `[401] Vui lòng đăng nhập lại`,
          action: { label: "Đăng nhập", onClick: () => window.location.href = "/login" },
        })
        break
      case 403:
        if (shouldToast("403")) toast.error("Không có quyền truy cập", { description: `[403] ${message}` })
        window.location.href = "/unauthorized"
        break
      case 404:
        if (shouldToast("404")) toast.warning("Không tìm thấy", { description: `[404] ${message}` })
        break
      case 500:
        if (shouldToast("500")) toast.error("Lỗi server", { description: `[500] Vui lòng thử lại sau` })
        break
      default:
        if (shouldToast(String(status ?? "N/A"))) toast.error("Lỗi không xác định", { description: `[${status ?? "N/A"}] ${message}` })
    }
  }

  private logout() {
    useAuthStore.getState().logout()
    window.location.href = "/login"
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


