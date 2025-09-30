export interface OrderRecipe {
  id: number
  ingredient_id: number
  order_detail_id: number
  quantity: number
  created_at?: string
  updated_at?: string
}

export interface OrderRecipeWithDetails extends OrderRecipe {
  ingredient: {
    id: number
    name: string
    unit: string
  }
  order_detail: {
    id: number
    dish_id: number
    order_id: number
  }
}

export interface CreateOrderRecipePayload {
  ingredient_id: number
  order_detail_id: number
  quantity: number
}

export interface UpdateOrderRecipePayload extends Partial<CreateOrderRecipePayload> {
  id: number
}
