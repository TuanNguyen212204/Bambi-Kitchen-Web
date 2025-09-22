export interface Discount {
  id: number
  name: string
  quantity: number
  start_at: string
  end_at: string
  code: string
  type: DiscountType
  value: number
  min_order_value?: number
  max_discount_value?: number
  applicable_products?: number[]
  usage_limit_per_user?: number
  is_active: boolean
  created_at?: string
  used_count?: number
}

export type DiscountType = 
  | "percentage"
  | "fixed"
  | "free_shipping"
  | "buy_x_get_y"

export interface ApplyDiscountPayload {
  order_id: number
  discount_code: string
  total_amount: number
}

export interface AppliedDiscount {
  id: number
  name: string
  code: string
  type: DiscountType
  value: number
  original_amount: number
  discounted_amount: number
  savings: number
  remaining_uses: number
  expires_at: string
}

export interface DiscountAnalytics {
  total_discounts: number
  active_discounts: number
  total_savings: number
  usage_rate: number
  revenue_impact: number
  top_discounts: DiscountUsage[]
  expired_discounts: number
}

export interface DiscountUsage {
  discount_id: number
  name: string
  code: string
  used_count: number
  total_savings: number
  average_order_value: number
  customer_segments: string[]
}