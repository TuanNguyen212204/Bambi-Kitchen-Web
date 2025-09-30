export interface Store {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export interface CreateStorePayload {
  name: string
}

export interface UpdateStorePayload extends Partial<CreateStorePayload> {
  id: number
}

export interface StoreAnalytics {
  store_id: number
  name: string
  total_orders: number
  total_revenue: number
  average_order_value: number
  top_dishes: {
    dish_id: number
    dish_name: string
    order_count: number
    revenue: number
  }[]
  peak_hours: string[]
  customer_count: number
}

export interface StoreSummary {
  id: number
  name: string
  order_count: number
  revenue: number
  last_order_date?: string
}
