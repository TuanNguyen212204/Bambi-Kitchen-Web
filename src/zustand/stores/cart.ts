import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartState, CartItem } from "@/zustand/types/cart"
import type { Dish } from "@models/dish/dish"

// Helper function để tính totals (cần ở ngoài để dùng trong onRehydrateStorage)
const calculateTotals = (items: CartItem[]) => {
  const totalPrice = items.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  return { totalPrice, totalItems }
}

export const useCartStore = create<CartState>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => {
          return {
            items: [],
            totalPrice: 0,
            totalItems: 0,

            addItem: (dish: Dish, quantity: number = 1, notes?: string) => {
              const state = get()
              const existingItem = state.items.find(item => item.dish.id === dish.id)

              if (existingItem) {
                // Nếu món đã có trong giỏ, tăng số lượng
                const updatedItems = state.items.map(item =>
                  item.id === existingItem.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                )
                const { totalPrice, totalItems } = calculateTotals(updatedItems)
                set({ items: updatedItems, totalPrice, totalItems })
              } else {
                // Thêm món mới vào giỏ
                const newItem: CartItem = {
                  id: Date.now(),
                  dish,
                  quantity,
                  notes,
                }
                const updatedItems = [...state.items, newItem]
                const { totalPrice, totalItems } = calculateTotals(updatedItems)
                set({ items: updatedItems, totalPrice, totalItems })
              }
            },

            removeItem: (itemId: number) => {
              const state = get()
              const updatedItems = state.items.filter(item => item.id !== itemId)
              const { totalPrice, totalItems } = calculateTotals(updatedItems)
              set({ items: updatedItems, totalPrice, totalItems })
            },

            updateQuantity: (itemId: number, quantity: number) => {
              if (quantity <= 0) {
                get().removeItem(itemId)
                return
              }

              const state = get()
              const updatedItems = state.items.map(item =>
                item.id === itemId ? { ...item, quantity } : item
              )
              const { totalPrice, totalItems } = calculateTotals(updatedItems)
              set({ items: updatedItems, totalPrice, totalItems })
            },

            updateNotes: (itemId: number, notes: string) => {
              const state = get()
              const updatedItems = state.items.map(item =>
                item.id === itemId ? { ...item, notes } : item
              )
              set({ items: updatedItems })
            },

            clearCart: () => {
              set({ items: [], totalPrice: 0, totalItems: 0 })
            },

            getItemQuantity: (dishId: number) => {
              const state = get()
              const item = state.items.find(item => item.dish.id === dishId)
              return item ? item.quantity : 0
            },
          }
        },
        {
          name: "bambi-cart-storage",
          storage: createJSONStorage(() => localStorage),
          partialize: (state: CartState) => ({
            items: state.items,
          }),
          onRehydrateStorage: () => (state) => {
            // Tính lại totals khi restore từ localStorage
            if (state) {
              const { totalPrice, totalItems } = calculateTotals(state.items)
              state.totalPrice = totalPrice
              state.totalItems = totalItems
            }
          },
        }
      )
    )
  )
)
