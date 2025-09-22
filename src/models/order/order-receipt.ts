import type { Ingredient } from "@models/ingredient/ingredient"
import type { OrderDetail } from "@models/order/order-detail"

export interface OrderReceipt {
  id: number
  ingredient_id: number
  order_detail_id: number
  quantity: number
  created_at?: string
  updated_at?: string
}

export interface OrderReceiptWithDetails extends OrderReceipt {
  ingredient: Ingredient
  order_detail: OrderDetail
}

export interface CreateOrderReceiptPayload {
  ingredient_id: number
  order_detail_id: number
  quantity: number
}

export interface UpdateOrderReceiptPayload extends Partial<CreateOrderReceiptPayload> {
  id: number
}

