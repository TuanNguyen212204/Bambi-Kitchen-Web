export interface DishCategory {
  id: number
  name: string
  description?: string
  icon?: string
  order: number
  is_active: boolean
  dish_count: number
  featured?: boolean
  color?: string
  created_at?: string
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

export interface CreateDishCategoryPayload {
  name: string
  description?: string
  icon?: string
  order?: number
  featured?: boolean
  color?: string
}

export interface UpdateDishCategoryPayload extends Partial<CreateDishCategoryPayload> {
  id: number
  is_active?: boolean
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