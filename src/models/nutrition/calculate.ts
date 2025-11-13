export type DishNutritionUnit = "g" | "kg" | "ml" | "l" | "pcs"

export interface DishNutritionIngredientInput {
  ingredientId?: number
  name: string
  amount: number
  unit: DishNutritionUnit
  per: string
  cal: number
  pro: number
  carb: number
  fat: number
  fiber: number
}

export interface DishNutritionRequest {
  name: string
  ingredients: DishNutritionIngredientInput[]
}

export interface DishNutritionAnalysisTotals {
  calories: number
  protein: number
  carb: number
  fat: number
  fiber: number
}

export interface DishNutritionAnalysis {
  score: number
  title: string
  roast: string
  totals: DishNutritionAnalysisTotals
  suggest: string
  [key: string]: unknown
}


