import { AxiosError } from "axios"

export class ApiError extends Error {
  public readonly status: number
  public readonly data: {
    code?: number
    errorCode?: number
    message?: string
    stack?: string
  }
  public readonly headers: Record<string, string | undefined>

  constructor(error: AxiosError) {
    super(
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      "Đã xảy ra lỗi API"
    )

    this.status = error.response?.status || 500
    this.data = error.response?.data || {}
    this.headers = (error.response?.headers || {}) as Record<string, string | undefined>

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.stack = error.stack || new Error().stack
  }


  get userFriendlyMessage(): string {
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

let lastErrorMsg = ""
let lastErrorAt = 0
export function shouldToast(msg: string, windowMs = 800): boolean {
  const now = Date.now()
  if (msg === lastErrorMsg && now - lastErrorAt < windowMs) return false
  lastErrorMsg = msg
  lastErrorAt = now
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