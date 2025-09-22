import type { Ingredient } from "@models/ingredient/ingredient"
import type { DietaryRestriction } from "@models/account/user"

export interface Nutrition {
  id: number
  ingredient_id: number
  calories: number
  protein: number
  carb: number
  fiber: number
  iron: number
  sodium: number
  calcium: number
  sugar: number
  sat_fat: number
  per_unit: string
  serving_size?: number
  total_fat?: number
  cholesterol?: number
  vitamin_a?: number
  vitamin_c?: number
  vitamin_d?: number
  created_at?: string
  source?: string
  verified?: boolean
}

export interface DailyNutritionGoal {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  sugar: number
  servings_per_day: number
}

export interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
  saturated_fat: number
  total_weight: number
  servings: number
}

export interface NutritionPercentage {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  sugar: number
}

export interface NutritionRecommendation {
  nutrient: NutrientType
  current: number
  goal: number
  difference: number
  suggestion: string
  priority: "high" | "medium" | "low"
  alternative_ingredients?: Ingredient[]
}

export type NutrientType = 
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "fiber"
  | "sugar"
  | "sodium"
  | "cholesterol"

export interface NutritionFilter {
  min_calories?: number
  max_calories?: number
  min_protein?: number
  dietary_restrictions?: DietaryRestriction[]
  allergens?: string[]
  sort_by?: "calories" | "protein" | "price"
}