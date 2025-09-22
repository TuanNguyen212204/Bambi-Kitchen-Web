import type { Dish, DifficultyLevel } from "@models/dish/dish"
import type { Ingredient } from "@models/ingredient/ingredient"
import type { DietaryRestriction } from "@models/account/user"
export interface Recipe {
  id: number 
  name: string 
  dish_id: number 
  ingredient_id: number 
  quantity: number 
  unit: string 
  step_number: number 
  preparation_method?: string 
  cooking_time?: number 
  notes?: string 
  is_optional: boolean 
  position: number 
  created_at?: string
  updated_at?: string
}


export interface RecipeStep {
  step_number: number
  title?: string 
  description?: string 
  estimated_time: number 
  ingredients: RecipeIngredient[]
  instructions?: string 
}


export interface RecipeIngredient extends Recipe {
  ingredient: Ingredient 
  cost: number 
  nutrition_contribution: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}


export interface CompleteRecipe extends Dish {
  total_cost: number 
  total_preparation_time: number 
  total_cooking_time: number 
  steps: RecipeStep[]
  nutrition_per_serving: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  servings: number 
  difficulty: DifficultyLevel
  equipment_needed?: string[] 
  skill_level_required?: number 
}

export interface RecipeFilter {
  dish_id?: number
  ingredient_id?: number
  category_id?: number
  max_preparation_time?: number
  difficulty?: DifficultyLevel
  dietary_restrictions?: DietaryRestriction[]
  search?: string 
  sort_by?: "time" | "difficulty" | "cost" | "popularity"
  order?: "asc" | "desc"
}