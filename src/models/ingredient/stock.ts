export interface IngredientStock {
  id: number
  name: string
  ingredient_id: number
  entry_date: string
  expired_date: string
  quantity: number
  active: boolean
  unit_price?: number
  total_cost?: number
  supplier?: string
  quality_notes?: string
  created_at?: string
  updated_at?: string
}

export interface StockTransaction {
  id: number
  ingredient_id: number
  order_id?: number
  create_at: string
  quantity: number
  type: StockTransactionType
  reason?: string
  staff_id?: number
  reference_id?: number
}

export type StockTransactionType = 
  | "purchase"
  | "sale"
  | "adjustment"
  | "waste"
  | "return"

export interface StockSummary {
  ingredient_id: number
  name: string
  current_stock: number
  low_threshold: number
  days_to_depletion: number
  last_restocked: string
  reorder_point: number
  status: "sufficient" | "low" | "critical" | "out"
}

export interface StockAlert {
  id: number
  ingredient_id: number
  ingredient_name: string
  current_stock: number
  low_threshold: number
  severity: "warning" | "critical"
  type: "low_stock" | "expired" | "quality_issue"
  created_at: string
  resolved: boolean
  resolved_at?: string
  staff_notified?: number[]
}

export interface StockReport {
  date: string
  total_value: number
  low_stock_items: number
  expired_items: number
  transactions: StockTransaction[]
  cost_of_goods_sold: number
  inventory_turnover: number
}