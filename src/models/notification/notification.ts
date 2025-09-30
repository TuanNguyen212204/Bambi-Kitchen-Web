import type { OrderStatus } from "@models/order/order"
import type { PaymentMethod, PaymentStatus } from "@models/payment/payment"

export interface Notification {
  id: number
  title: string
  create_at: string
  is_read: boolean
  content: string
  account_id: number
  created_at?: string
  updated_at?: string
}

export type NotificationType = 
  | "order"
  | "payment"
  | "stock"
  | "feedback"
  | "promo"
  | "system"
  | "delivery"

export type NotificationPriority = 
  | "low"
  | "normal"
  | "high"
  | "critical"

export interface OrderNotification extends Notification {
  type: "order"
  order_id: number
  order_status: OrderStatus
  customer_name: string
  estimated_time?: string
}

export interface StockNotification extends Notification {
  type: "stock"
  ingredient_id: number
  ingredient_name: string
  current_stock: number
  low_threshold: number
  severity: "warning" | "critical"
}

export interface PaymentNotification extends Notification {
  type: "payment"
  payment_id: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
}

export interface RealtimeNotification {
  type: "order_new" | "order_update" | "stock_alert" | "payment"
  data: Notification
  recipients: number[]
  broadcast: boolean
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  in_app: boolean
  order_updates: boolean
  stock_alerts: boolean
  promo_notifications: boolean
}

export interface NotificationAnalytics {
  total_sent: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  by_type: Record<NotificationType, number>
  by_channel: Record<"email" | "push" | "in_app", number>
}