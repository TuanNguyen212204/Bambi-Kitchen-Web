import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import type { CartState, CartItem } from "@/zustand/types/cart"
import type { Dish } from "@models/dish/dish"

// Helper function để tính totals
const calculateTotals = (items: CartItem[]) => {
  const totalPrice = items.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  return { totalPrice, totalItems }
}

// Helper function để lấy storage key dựa trên userId
const getStorageKey = (userId: number | undefined): string => {
  if (userId) {
    return `bambi-cart-storage-${userId}`
  }
  return "bambi-cart-storage-temp"
}

// Helper function để load cart từ localStorage
const loadCartFromStorage = (userId: number | undefined): CartItem[] => {
  try {
    const storageKey = getStorageKey(userId)
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Zustand persist format: { state: { items: [...] }, version: 0 }
      // Hoặc format đơn giản: { items: [...] }
      if (parsed.state && parsed.state.items) {
        return parsed.state.items || []
      } else if (parsed.items) {
        return parsed.items || []
      }
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Helper function để save cart vào localStorage
const saveCartToStorage = (userId: number | undefined, items: CartItem[]): void => {
  try {
    if (!userId) {
      // Nếu chưa đăng nhập, không lưu cart
      return
    }
    const storageKey = getStorageKey(userId)
    localStorage.setItem(storageKey, JSON.stringify({ items }))
    
    // Xóa cart tạm thời nếu có
    const tempKey = "bambi-cart-storage-temp"
    localStorage.removeItem(tempKey)
  } catch {
    // Ignore errors
  }
}

export const useCartStore = create<CartState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => {
        // Function để lấy userId hiện tại từ auth store
        const getCurrentUserId = (): number | undefined => {
          try {
            const authStorage = localStorage.getItem("bambi-auth-storage")
            if (authStorage) {
              const authData = JSON.parse(authStorage)
              return authData.state?.user?.id
            }
          } catch {
            // Ignore errors
          }
          return undefined
        }
        
        // Function để sync cart với localStorage
        const syncCartToStorage = () => {
          const state = get()
          const userId = getCurrentUserId()
          saveCartToStorage(userId, state.items)
        }

        return {
          items: [],
          totalPrice: 0,
          totalItems: 0,

          addItem: (dish: Dish, quantity: number = 1, notes?: string) => {
            // Kiểm tra auth state từ localStorage để tránh circular dependency
            const userId = getCurrentUserId()
            if (!userId) {
              // Không cho thêm vào cart nếu chưa đăng nhập
              return
            }

            const state = get()
            const existingItem = state.items.find(item => 
              item.dish.id === dish.id && 
              item.notes === notes // So sánh cả notes để phân biệt custom bowl
            )

            if (existingItem) {
              // Nếu món đã có trong giỏ, tăng số lượng
              const updatedItems = state.items.map(item =>
                item.id === existingItem.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
              const { totalPrice, totalItems } = calculateTotals(updatedItems)
              set({ items: updatedItems, totalPrice, totalItems })
              syncCartToStorage()
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
              syncCartToStorage()
            }
          },

          removeItem: (itemId: number) => {
            const state = get()
            const updatedItems = state.items.filter(item => item.id !== itemId)
            const { totalPrice, totalItems } = calculateTotals(updatedItems)
            set({ items: updatedItems, totalPrice, totalItems })
            syncCartToStorage()
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
            syncCartToStorage()
          },

          updateNotes: (itemId: number, notes: string) => {
            const state = get()
            const updatedItems = state.items.map(item =>
              item.id === itemId ? { ...item, notes } : item
            )
            set({ items: updatedItems })
            syncCartToStorage()
          },

          updateItem: (itemId: number, dish: Dish, quantity: number, notes?: string) => {
            const userId = getCurrentUserId()
            if (!userId) {
              return
            }

            const state = get()
            const updatedItems = state.items.map(item =>
              item.id === itemId ? { ...item, dish, quantity, notes } : item
            )
            const { totalPrice, totalItems } = calculateTotals(updatedItems)
            set({ items: updatedItems, totalPrice, totalItems })
            syncCartToStorage()
          },

          clearCart: () => {
            set({ items: [], totalPrice: 0, totalItems: 0 })
            syncCartToStorage()
          },

          getItemQuantity: (dishId: number) => {
            const state = get()
            const item = state.items.find(item => item.dish.id === dishId)
            return item ? item.quantity : 0
          },

          // Method để load cart của user mới khi đăng nhập
          loadUserCart: (userId: number) => {
            const items = loadCartFromStorage(userId)
            const { totalPrice, totalItems } = calculateTotals(items)
            set({ items, totalPrice, totalItems })
            // Sync lại vào storage với userId mới
            saveCartToStorage(userId, items)
          },
        }
      },
      { name: "CartStore" }
    )
  )
)

// Subscribe to auth store changes để sync cart khi login/logout
// Sử dụng dynamic import để tránh circular dependency
if (typeof window !== "undefined") {
  // Kiểm tra auth state khi khởi tạo và load cart
  const initCartFromStorage = async () => {
    try {
      // Import auth store dynamically
      const { useAuthStore } = await import("./auth")
      const authState = useAuthStore.getState()
      
      if (authState.isAuthenticated && authState.user?.id) {
        // Load cart của user hiện tại
        useCartStore.getState().loadUserCart(authState.user.id)
      } else {
        // Nếu chưa đăng nhập, clear cart
        useCartStore.getState().clearCart()
      }
    } catch {
      // Ignore errors
    }
  }

  // Load cart khi khởi tạo
  initCartFromStorage()

  // Subscribe vào auth store để detect changes
  // Sử dụng setTimeout để đảm bảo auth store đã được khởi tạo
  setTimeout(async () => {
    try {
      const { useAuthStore } = await import("./auth")
      useAuthStore.subscribe((state, prevState) => {
        const authState = {
          isAuthenticated: state.isAuthenticated,
          userId: state.user?.id,
        }
        const prevAuthState = {
          isAuthenticated: prevState?.isAuthenticated ?? false,
          userId: prevState?.user?.id,
        }

        if (
          authState.isAuthenticated !== prevAuthState.isAuthenticated ||
          authState.userId !== prevAuthState.userId
        ) {
          if (authState.isAuthenticated && authState.userId) {
            useCartStore.getState().loadUserCart(authState.userId)
          } else {
            useCartStore.getState().clearCart()
          }
        }
      })
    } catch {
      // Ignore errors nếu không thể subscribe
    }
  }, 100)
}
