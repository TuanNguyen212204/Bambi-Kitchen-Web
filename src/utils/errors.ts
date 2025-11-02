import { AxiosError } from "axios"

/**
 * Helper function để extract error message từ API response
 * Backend trả về format: { "error": "message" } hoặc { "message": "message" }
 */
export function extractErrorMessage(error: unknown): string {
  // Kiểm tra nếu là AxiosError
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError
    const responseData = axiosError.response?.data as { error?: string; message?: string } | undefined
    
    // Ưu tiên lấy từ field "error" (theo format mới của backend)
    if (responseData?.error && typeof responseData.error === 'string') {
      return responseData.error
    }
    
    // Fallback sang field "message" (format cũ)
    if (responseData?.message && typeof responseData.message === 'string') {
      return responseData.message
    }
  }
  
  // Nếu là Error object có message
  if (error instanceof Error) {
    return error.message
  }
  
  // Fallback cuối cùng
  return "Đã xảy ra lỗi không xác định"
}

export class ApiError extends Error {
  public readonly status: number
  public readonly data: {
    code?: number
    errorCode?: number
    message?: string
    error?: string
    stack?: string
  }
  public readonly headers: Record<string, string | undefined>

  constructor(error: AxiosError) {
    const responseData = error.response?.data as { error?: string; message?: string } | undefined
    // Ưu tiên lấy từ field "error" (format mới của backend)
    const errorMessage = responseData?.error || responseData?.message || error.message || "Đã xảy ra lỗi API"
    
    super(errorMessage)

    this.status = error.response?.status || 500
    this.data = error.response?.data || {}
    this.headers = (error.response?.headers || {}) as Record<string, string | undefined>

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.stack = error.stack || new Error().stack
  }


  get userFriendlyMessage(): string {
    // Ưu tiên lấy message từ response data (field "error" hoặc "message")
    const backendMessage = this.data?.error || this.data?.message
    if (backendMessage && typeof backendMessage === 'string') {
      return backendMessage
    }
    
    // Fallback theo status code
    switch (this.status) {
      case 401:
        return "Phiên đăng nhập đã hết hạn"
      case 403:
        return "Bạn không có quyền thực hiện hành động này"
      case 404:
        return "Không tìm thấy dữ liệu"
      case 422:
        return "Dữ liệu không hợp lệ"
      case 500:
        return "Lỗi hệ thống. Vui lòng thử lại sau"
      default:
        return this.message
    }
  }


  get isNetworkError(): boolean {
    return !this.status || this.status >= 500
  }


  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }
}

// Dùng Map để track nhiều toast key cùng lúc (không chỉ 1 message)
const toastHistory = new Map<string, number>()
export function shouldToast(key: string, windowMs = 800): boolean {
  const now = Date.now()
  const lastToastAt = toastHistory.get(key)
  
  if (lastToastAt && now - lastToastAt < windowMs) {
    return false
  }
  
  toastHistory.set(key, now)
  
  // Cleanup old entries (older than 5 seconds)
  for (const [k, timestamp] of toastHistory.entries()) {
    if (now - timestamp > 5000) {
      toastHistory.delete(k)
    }
  }
  
  return true
}

export class OrderError extends ApiError {
  constructor(error: AxiosError, orderId?: string) {
    super(error)
    this.name = "OrderError"
    if (orderId) {
      this.message = `Lỗi với đơn hàng #${orderId}: ${this.userFriendlyMessage}`
    }
  }
}

export class IngredientError extends ApiError {
  constructor(error: AxiosError, ingredientName?: string) {
    super(error)
    this.name = "IngredientError"
    if (ingredientName) {
      this.message = `Lỗi với nguyên liệu "${ingredientName}": ${this.userFriendlyMessage}`
    }
  }
}

export class PaymentError extends ApiError {
  constructor(error: AxiosError, paymentMethod?: string) {
    super(error)
    this.name = "PaymentError"
    this.message = `Lỗi thanh toán ${paymentMethod || ""}: ${this.userFriendlyMessage}`
  }
}