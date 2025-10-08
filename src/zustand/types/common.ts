// Common/shared types used across stores
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface LoadingState {
  orders: boolean
  ingredients: boolean
  analytics: boolean
  aiSuggestions: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DateRange {
  start: Date
  end: Date
}

// Error handling
export interface AppError {
  code: string
  message: string
  userFriendlyMessage?: string
  details?: unknown
}
