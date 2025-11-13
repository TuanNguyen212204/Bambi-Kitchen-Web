import type { DishNutritionAnalysis, DishNutritionRequest, DishNutritionIngredientInput } from "@models/nutrition/calculate"

export type ChatRole = "user" | "assistant" | "system"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  isError?: boolean
  metadata?: ChatMessageMetadata
}

export interface ChatErrorState {
  message: string
  canRetry: boolean
  source: "chat" | "analysis"
}

export interface NutritionIngredientContribution extends DishNutritionIngredientInput {
  missing?: boolean
}

export interface ChatMessageNutritionMetadata {
  type: "nutrition-analysis"
  dishId: number
  dishName: string
  payload: DishNutritionRequest
  generatedAt: string
  contributions: NutritionIngredientContribution[]
  analysis: DishNutritionAnalysis
  missingIngredients?: Array<{ id: number; name: string }>
}

export type ChatMessageMetadata = ChatMessageNutritionMetadata


