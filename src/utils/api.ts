import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosRequestHeaders } from "axios"
import { ApiError } from "@utils/errors"
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "https://bambi.kdz.asia"

class BambiApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string | null) => void> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
        const { token } = useAuthStore.getState()

        if (token && !config.skipAuth) {
          config.headers = (config.headers ?? {}) as AxiosRequestHeaders
          ;(config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`
        }

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


        if (error.response?.status === 401 && !originalRequest.skipAuth) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.addRefreshSubscriber((token) => {
                if (token) {
                  originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders
                  ;(originalRequest.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`
                  resolve(this.client(originalRequest))
                } else {
                  reject(error)
                }
              })
            })
          }

          this.isRefreshing = true

          try {
            const newToken = await this.refreshToken()
            this.isRefreshing = false

            if (newToken) {
              originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders
              ;(originalRequest.headers as AxiosRequestHeaders).Authorization = `Bearer ${newToken}`
              this.onRefreshed(newToken)
              return this.client(originalRequest)
            }
          } catch {
            this.isRefreshing = false
            this.onRefreshFailed()
            this.logout()
          }
        }

        this.handleError(error)

        return Promise.reject(new ApiError(error))
      }
    )
  }

  private addRefreshSubscriber(callback: (token: string | null) => void) {
    this.refreshSubscribers.push(callback)
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

  private onRefreshFailed() {
    this.refreshSubscribers.forEach((callback) => callback(null))
    this.refreshSubscribers = []
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (!refreshToken) throw new Error("No refresh token")

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      const { token, refresh_token } = response.data
      localStorage.setItem("access_token", token)
      localStorage.setItem("refresh_token", refresh_token)
      
      return token
    } catch {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      return null
    }
  }

  private handleError(error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const status = err.response?.status
    const message = err.response?.data?.message || err.message || "Có lỗi xảy ra"

    switch (status) {
      case 401:
        toast.error("Phiên đăng nhập hết hạn", {
          description: "Vui lòng đăng nhập lại",
          action: {
            label: "Đăng nhập",
            onClick: () => window.location.href = "/login",
          },
        })
        break
        
      case 403:
        toast.error("Không có quyền truy cập", {
          description: message,
        })
        window.location.href = "/unauthorized"
        break
        
      case 404:
        toast.warning("Không tìm thấy", {
          description: message,
        })
        break
        
      case 500:
        toast.error("Lỗi server", {
          description: "Vui lòng thử lại sau",
        })
        break

      default:
        toast.error("Lỗi không xác định", {
          description: message,
        })
    }
  }

  private logout() {
    useAuthStore.getState().logout()
    window.location.href = "/login"
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, options)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | undefined>,
    }
  }

  async post<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, options)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | undefined>,
    }
  }

  async put<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, options)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | undefined>,
    }
  }

  async patch<T, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.patch<T>(url, data, options)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | undefined>,
    }
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, options)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string | undefined>,
    }
  }
}

export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_ME: "/api/user/me",
  
  ORDERS: "/orders",
  ORDER_CREATE: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  FAVORITES: "/favorites",
  PROFILE: "/profile",
  
  API_NOTIFICATIONS: "/api/notifications",
  API_NOTIFICATION_BY_ID: (id: number) => `/api/notifications/${id}`,
  API_NOTIFICATION_BY_ACCOUNT: (id: number) => `/api/notifications/account/${id}`,
  API_NOTIFICATION_MARK_READ: (id: number) => `/api/notifications/${id}/read`,

  API_INGREDIENTS: "/api/ingredient",
  API_INGREDIENT_BY_ID: (id: number) => `/api/ingredient/${id}`,
  API_INGREDIENT_SEARCH_BY_NAME: (name: string) => `/api/ingredient/search?name=${encodeURIComponent(name)}`,
  API_INGREDIENT_DETAILS: "/api/ingredient-details",
  API_INGREDIENT_DETAIL_BY_ID: (id: number) => `/api/ingredient-details/${id}`,
  API_INGREDIENT_DETAILS_BY_INGREDIENT: (ingredientId: number) => `/api/ingredient-details/ingredient/${ingredientId}`,
  API_INGREDIENT_DETAIL_TOGGLE_ACTIVE: (id: number) => `/api/ingredient-details/toggle-active/${id}`,
  API_INGREDIENT_CATEGORIES: "/api/ingredient-categories",
  API_INGREDIENT_CATEGORY_BY_ID: (id: number) => `/api/ingredient-categories/${id}`,

  API_DISHES: "/api/dish",
  API_DISH_BY_ID: (id: number) => `/api/dish/${id}`,
  API_DISH_CATEGORIES: "/api/dish-category",
  API_DISH_CATEGORY_BY_ID: (id: number) => `/api/dish-category/${id}`,

  API_DISCOUNTS: "/api/discount",
  API_DISCOUNT_BY_ID: (id: number) => `/api/discount/${id}`,
  
  AI_ANALYZE: "/ai/analyze",
  AI_SUGGESTIONS: "/ai/suggestions",
  
  ACTIVE_ORDERS: "/staff/orders/active",
  ORDER_STATUS: (id: string) => `/staff/orders/${id}/status`,
  CLAIM_ORDER: (id: string) => `/staff/orders/${id}/claim`,
  PAYMENTS: "/staff/payments",
  
  REVENUE: "/admin/revenue",
  USERS: "/admin/users",
  MENU: "/admin/menu",
  FEEDBACK: "/admin/feedback",
  INGREDIENT_STOCK: "/admin/ingredients/stock",
} as const

export const bambiApi = new BambiApiClient()


export const apiQueryKeys = {

  auth: ["auth"] as const,
  

  orders: (userId?: string) => ["orders", userId] as const,
  order: (id: string) => ["order", id] as const,
  favorites: (userId: string) => ["favorites", userId] as const,
  

  ingredients: (category?: string) => ["ingredients", category] as const,
  dishes: (categoryId?: number) => ["dishes", categoryId] as const,

  aiAnalysis: (orderId: string) => ["ai-analysis", orderId] as const,
  

  activeOrders: () => ["active-orders"] as const,
  

  revenue: (startDate: string, endDate: string) => ["revenue", startDate, endDate] as const,
  users: () => ["users"] as const,
} as const