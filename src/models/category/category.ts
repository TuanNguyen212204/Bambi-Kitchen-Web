export interface DishCategory {
  id: number
  name: string
  description?: string
}

export interface IngredientCategory {
  id: number
  name: string
  description?: string
}

export interface IngredientCategoryEntity {
  id: number
  name: string
  description: string
  icon: string
  step_number: number
  is_required: boolean
  max_selections?: number
  min_selections?: number
  order: number
}

export type IngredientCategoryType = 
  | "rice"
  | "protein"
  | "vegetables"
  | "soup"
  | "dessert"

export interface DishCategoryCreateRequest {
  name: string
  description?: string
}

export interface DishCategoryUpdateRequest {
  id: number
  name: string
  description?: string
}

export interface CategoryAnalytics {
  category_id: number
  name: string
  total_dishes: number
  total_revenue: number
  average_price: number
  popularity_score: number
  trend_30d: number
  top_dish: string
}