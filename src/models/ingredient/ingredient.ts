export interface Ingredient {
  id: number
  name: string
  ingredient_category_id: number
  unit: string
  status: IngredientStatus
  category: IngredientCategory
  imgUrl?: string
  store_id: number
  created_at?: string
  updated_at?: string
}

export type IngredientCategory = 
  | "rice"
  | "protein"
  | "vegetables"
  | "soup"
  | "dessert"

export type IngredientStatus = 
  | "active"
  | "inactive"
  | "low_stock"
  | "out_of_stock"
  | "expired"

export interface IngredientPricing {
  id: number
  ingredient_id: number
  price_per_unit: number
  currency: "VND"
  valid_from: string
  valid_to?: string
  supplier?: string
}

export interface PricedIngredient extends Ingredient {
  price_per_unit: number
  available_quantity?: number
  cost_per_serving?: number
}

export interface CreateIngredientPayload {
  name: string
  category: IngredientCategory
  unit: string
  status?: IngredientStatus
  price_per_unit: number
  description?: string
  image_url?: string
  category_id?: number
}

export interface UpdateIngredientPayload extends Partial<CreateIngredientPayload> {
  id: number
}