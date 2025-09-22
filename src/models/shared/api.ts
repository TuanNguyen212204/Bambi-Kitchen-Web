import type { AxiosRequestConfig } from "axios"

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: number
  _maxRetries?: number
  _delayMs?: number
  skipAuth?: boolean
}

export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string | undefined>
  success: boolean
  message?: string
  errorCode?: number
  timestamp?: string
  path?: string
}

export interface RequestOptions extends Omit<AxiosRequestConfig, "baseURL" | "url" | "method"> {
  retry?: {
    maxRetries: number
    delayMs: number
  }
  skipAuth?: boolean
  skipErrorToast?: boolean
}

export interface AuthConfig {
  tokenProvider: () => string | null | Promise<string | null>
  tokenType?: string
  refreshToken?: () => Promise<string | null>
  onRefreshFailure?: () => void
}

export interface HttpClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
  auth?: AuthConfig
  defaultRetry?: {
    maxRetries: number
    delayMs: number
  }
  DEBUG?: boolean
}

export interface HttpClientService {
  get<T = unknown>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  post<T = unknown, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>>
  put<T = unknown, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>>
  patch<T = unknown, D = unknown>(url: string, data?: D, options?: RequestOptions): Promise<ApiResponse<T>>
  delete<T = unknown>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
}

export interface PaginatedResponse<T> {
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  status: number
  statusText: string
  headers: Record<string, string | undefined>
  success: boolean
  message?: string
  errorCode?: number
  timestamp?: string
  path?: string
}

export interface FileUploadResponse {
  file_id: number
  url: string
  filename: string
  size: number
  mime_type: string
  uploaded_at: string
}