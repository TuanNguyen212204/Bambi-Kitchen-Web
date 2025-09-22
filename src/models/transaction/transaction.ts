import type { IngredientCategory } from "@models/ingredient/ingredient"
export interface IngredientTransaction {
  id: number
  ingredient_id: number
  order_id?: number
  create_at: string
  quantity: number
  type: TransactionType
  reason?: string
  reference_id?: number
  staff_id?: number
  notes?: string
  cost?: number
}

export type TransactionType = 
  | "purchase"
  | "sale"
  | "adjustment"
  | "waste"
  | "return"
  | "transfer"

export interface DailyTransactionSummary {
  date: string
  total_transactions: number
  total_value: number
  by_type: Record<TransactionType, number>
  top_ingredients: {
    ingredient_id: number
    name: string
    quantity_moved: number
    value: number
  }[]
  waste_percentage: number
}

export interface InventoryValuation {
  total_value: number
  cost_of_goods_available: number
  inventory_turnover: number
  days_inventory_outstanding: number
  by_category: Record<IngredientCategory, number>
}