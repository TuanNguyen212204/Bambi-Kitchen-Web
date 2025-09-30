import type { Dish } from "@models/dish/dish"
import type { IngredientCategory } from "@models/ingredient/ingredient"
export interface OrderDetail {
  id: number
  dish_id: number
  order_id: number
  total_calories: number
  note?: string
  created_at?: string
  updated_at?: string
}

export interface CustomOrderItem {
  id: number
  order_detail_id?: number
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
  position?: number
}

export interface CompleteOrderDetail extends OrderDetail {
  dish?: Dish
  custom_ingredients: CustomOrderItem[]
  total_ingredients: number
  nutrition_breakdown: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  preparation_steps?: PreparationStep[]
}

export interface PreparationStep {
  step_number: number
  title: string
  ingredients_needed: CustomOrderItem[]
  estimated_time: number
  actual_time?: number
  completed: boolean
  staff_id?: number
}

export interface OrderDetailSummary {
  id: number
  name: string
  quantity: number
  price: number
  calories: number
  ingredients: string[]
  status: "pending" | "preparing" | "completed"
}