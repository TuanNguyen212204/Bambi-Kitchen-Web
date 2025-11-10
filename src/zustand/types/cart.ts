import type { Dish } from "@models/dish/dish"

export interface CartItem {
  id: number
  dish: Dish
  quantity: number
  notes?: string
}

export interface CartState {
  items: CartItem[]
  totalPrice: number
  totalItems: number
  
  // Actions
  addItem: (dish: Dish, quantity?: number, notes?: string) => void
  removeItem: (itemId: number) => void
  updateQuantity: (itemId: number, quantity: number) => void
  updateNotes: (itemId: number, notes: string) => void
  clearCart: () => void
  getItemQuantity: (dishId: number) => number
  loadUserCart: (userId: number) => void
}

