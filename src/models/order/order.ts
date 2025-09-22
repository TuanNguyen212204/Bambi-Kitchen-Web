import type { IngredientCategory } from "@models/ingredient/ingredient"
import type { PaymentMethod } from "@models/payment/payment"


export interface AIAnalysisOutput {
  score: number
  suggestions: string[]
  health_rating: number
  cost_optimization: string[]
}

export interface Order {
  id: number
  name: string
  create_at: string
  total_price: number
  status: OrderStatus
  user_id: number
  staff_id?: number
  note?: string
  ranking?: number
  feedback?: string
  total_calories?: number
  payment_method?: PaymentMethod
  discount_id?: number
  discount_amount?: number
  final_price?: number
  delivery_address?: string
  phone_number?: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  ai_analysis?: AIAnalysisOutput
}

export type OrderStatus = 
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"

// PaymentMethod imported from @models/payment/payment

export interface CreateOrderPayload {
  user_id: number
  customer_name: string
  phone_number: string
  delivery_address?: string
  items: OrderItem[]
  payment_method: PaymentMethod
  note?: string
  discount_code?: string
  ai_analysis?: AIAnalysisOutput
}

export interface OrderItem {
  id?: number
  order_id?: number
  dish_id?: number
  dish_name?: string
  ingredients: OrderIngredient[]
  quantity: number
  price_per_serving: number
  sub_total: number
  total_calories: number
  notes?: string
  preparation_notes?: string
  ai_suggestions?: string[]
}

export interface OrderIngredient {
  id?: number
  order_item_id?: number
  ingredient_id: number
  ingredient_name: string
  category: IngredientCategory
  quantity: number
  unit: string
  price_per_unit: number
  sub_total: number
  calories_per_unit: number
  sub_calories: number
  notes?: string
}

export interface OrderSummary {
  id: number
  name?: string
  total_price: number
  final_price: number
  total_calories: number
  status: OrderStatus
  payment_method: PaymentMethod
  items_count: number
  created_at: string
  completed_at?: string
  ai_score?: number
  delivery_status?: "preparing" | "out_for_delivery" | "delivered"
  estimated_time?: string
  tracking_url?: string
}

export interface OrderAnalytics {
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  pending_orders: number
  average_completion_time: number
  peak_hours: string[]
  cancellation_reasons: Record<string, number>
  repeat_customer_rate: number
  average_items_per_order: number
  total_revenue: number
  average_order_value: number
}