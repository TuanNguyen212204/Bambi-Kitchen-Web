import type { Ingredient } from "@models/ingredient/ingredient"
import type { DietaryRestriction } from "@models/account/user"

export interface Dish {
  id: number
  name: string
  price: number
  img_url: string
  imgUrl?: string
  account_id: number
  dish_category_id: number
  type: DishType
  description: string
  is_public: boolean
  used: number
  created_at?: string
  updated_at?: string
}

export type DishType = 
  | "combo"
  | "single"
  | "custom"
  | "quick"
  | "signature"

export interface DishWithIngredients extends Dish {
  ingredients: DishIngredient[]
  nutrition: DishNutrition
  preparation_time: number
  servings: number
  difficulty: DifficultyLevel
  tags: string[]
  ai_rating?: number
}

export interface DishIngredient {
  id?: number
  dish_id: number
  ingredient_id: number
  quantity: number
  unit: string
  is_optional: boolean
  preparation_note?: string
  position?: number
  ingredient?: Ingredient
}

export interface DishNutrition {
  calories_per_serving: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  serving_size: number
}

export type DifficultyLevel = 
  | "easy"
  | "medium"
  | "hard"

export interface CreateDishPayload {
  name: string
  price: number
  description: string
  category_id: number
  type: DishType
  is_public: boolean
  ingredients: CreateDishIngredient[]
  image_url?: string
  preparation_time?: number
  servings?: number
  difficulty?: DifficultyLevel
  tags?: string[]
}

export interface UpdateDishPayload extends Partial<CreateDishPayload> {
  id: number
}

export interface CreateDishIngredient {
  ingredient_id: number
  quantity: number
  unit: string
  is_optional?: boolean
  preparation_note?: string
  position?: number
}

export interface DishFilter {
  category_id?: number
  type?: DishType
  min_price?: number
  max_price?: number
  max_calories?: number
  difficulty?: DifficultyLevel
  dietary_restrictions?: DietaryRestriction[]
  allergens?: string[]
  search?: string
  is_public?: boolean
  status?: "active" | "inactive"
  sort_by?: "price" | "calories" | "popularity" | "ai_rating"
  order?: "asc" | "desc"
  limit?: number
  page?: number
}

export interface DishAnalytics {
  dish: Dish
  total_sold: number
  total_revenue: number
  average_rating: number
  popularity_score: number
  trend_7d: number
  peak_hours: string[]
  customer_segments: Record<string, number>
}