// Kitchen-related types
export const ORDER_STEPS = {
  RICE: "RICE",
  PROTEIN: "PROTEIN",
  VEGETABLES: "VEGETABLES",
  SOUP: "SOUP",
  DESSERT: "DESSERT",
} as const

export const INGREDIENT_CATEGORIES = {
  RICE: "RICE",
  PROTEIN: "PROTEIN",
  VEGETABLES: "VEGETABLES",
  SOUP: "SOUP",
  DESSERT: "DESSERT",
} as const

export interface Ingredient {
  id: number
  name: string
  category: keyof typeof INGREDIENT_CATEGORIES
  unit: string
  status: "active" | "inactive" | "low_stock" | "out_of_stock"
  calories_per_unit: number
  price_per_unit: number
  image_url?: string
  description?: string
  nutrition?: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
}

export interface Dish {
  id: number
  name: string
  price: number
  image_url: string
  description: string
  category_id: number
  is_public: boolean
  used_count: number
  account_id: number // Creator
}

export interface OrderItem {
  id: number
  ingredient_id: number
  ingredient: Ingredient
  quantity: number
  notes?: string
  sub_total: number // calories * quantity
  step?: keyof typeof ORDER_STEPS
}

export interface Order {
  id?: number
  customer_id: number
  customer_name: string
  items: OrderItem[]
  total_calories: number
  total_price: number
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  payment_method: "online" | "cod"
  discount_id?: number
  discount_amount?: number
  final_price: number
  note?: string
  ai_analysis?: {
    health_score: number // 0-100
    nutrition_balance: {
      protein: number // percentage
      carbs: number
      fat: number
      calories: number
    }
    suggestions: string[]
    warnings: string[]
  }
  created_at: Date
  updated_at?: Date
  staff_id?: number // Assigned staff
  ranking?: number // Customer rating 1-5
  feedback?: string
}

export interface QuickOrderTemplate {
  id: number
  name: string
  description: string
  ingredients: Array<{
    ingredient_id: number
    quantity: number
    notes?: string
  }>
  estimated_calories: number
  estimated_price: number
  category: string
  is_public: boolean
  created_by: number
  used_count: number
}

export interface KitchenState {
  // Orders
  activeOrders: Order[]
  assignedOrders: Order[]
  orderHistory: Order[]
  currentOrder: Order | null
  
  // Builder
  currentStep: keyof typeof ORDER_STEPS
  note: string
  
  // Ingredients & Inventory
  ingredients: Ingredient[]
  availableIngredients: Ingredient[]
  lowStockIngredients: Ingredient[]
  
  // Quick Orders
  quickOrderTemplates: QuickOrderTemplate[]
  
  // Loading states
  loading: {
    orders: boolean
    ingredients: boolean
    analytics: boolean
    aiSuggestions: boolean
  }
  
  // Actions
  fetchActiveOrders: () => Promise<void>
  fetchOrderHistory: () => Promise<void>
  claimOrder: (orderId: number) => Promise<void>
  updateOrderStatus: (orderId: number, status: Order["status"]) => Promise<void>
  confirmPayment: (orderId: number) => Promise<void>
  completeOrder: (orderId: number, paymentMethod: string) => Promise<void>
  
  // Builder actions
  setCurrentStep: (step: keyof typeof ORDER_STEPS) => void
  setNote: (note: string) => void
  addIngredientToOrder: (ingredient: Ingredient, quantity: number, notes?: string) => void
  removeIngredientFromOrder: (ingredientId: number) => void
  clearCurrentOrder: () => void
  
  // Ingredients
  fetchIngredients: () => Promise<void>
  toggleIngredientAvailability: (ingredientId: number) => Promise<void>
  updateIngredientStock: (ingredientId: number, quantity: number) => Promise<void>
  
  // Quick Orders
  fetchQuickOrderTemplates: () => Promise<void>
  createQuickOrderFromTemplate: (templateId: number) => Promise<void>
  
  // AI & Analytics
  getAISuggestions: (orderData: Partial<Order>) => Promise<void>
  fetchAnalytics: (dateRange: { start: Date; end: Date }) => Promise<void>
  
  // Utility
  reorder: (orderId: number) => Promise<void>
  rateOrder: (orderId: number, rating: number, feedback?: string) => Promise<void>
}
