export interface Payment {
  id: number 
  order_id: number 
  method: PaymentMethod
  create_at: string 
  comple_at?: string 
  discount_id?: number
  status: PaymentStatus
  created_at?: string
  updated_at?: string
}

export type PaymentMethod = 
  | "online"
  | "cod"
  | "bank_transfer"
  | "wallet"

export type PaymentStatus = 
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"

export interface CreatePaymentPayload {
  order_id: number
  method: PaymentMethod
  amount: number
  currency?: string
  discount_code?: string
  return_url?: string
  cancel_url?: string
  ipn_url?: string
}

export interface PaymentGatewayResponse {
  transaction_id: string
  payment_url: string
  status: "success" | "pending" | "failed"
  amount: number
  order_id: string
  signature?: string
  gateway: "vnpay" | "momo" | "zalo"
  qr_code?: string
}

export interface CODPaymentConfirmation {
  order_id: number
  amount_received: number
  expected_amount: number
  change_amount?: number
  payment_notes?: string
  staff_id: number
  confirmed_at: string
}

export interface PaymentHistoryItem {
  id: number
  order_id: number
  order_name?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  created_at: string
  completed_at?: string
  transaction_id?: string
  refund_amount?: number
}

export interface PaymentAnalytics {
  total_payments: number
  total_amount: number
  success_rate: number
  average_processing_time: number
  top_methods: Record<PaymentMethod, number>
  failed_payments: number
  refund_rate: number
  peak_payment_hours: string[]
}