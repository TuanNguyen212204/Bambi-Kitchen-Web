import type { Ingredient } from "@models/ingredient/ingredient"
import type { Dish } from "@models/dish/dish"

export interface Receipt {
  id: number
  name: string
  ingredient_id: number
  quantity: number
  dish_id: number
  created_at?: string
  updated_at?: string
}

export interface ReceiptWithDetails extends Receipt {
  ingredient: Ingredient
  dish: Dish
}

export interface CreateReceiptPayload {
  name: string
  ingredient_id: number
  quantity: number
  dish_id: number
}

export interface UpdateReceiptPayload extends Partial<CreateReceiptPayload> {
  id: number
}

