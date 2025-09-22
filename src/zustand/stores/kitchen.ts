import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { ORDER_STEPS, INGREDIENT_CATEGORIES, NUTRITION_CONFIG } from "@/config/constants"
import { ApiError } from "@/utils/errors"

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
  account_id: number 
}

export interface OrderItem {
  id: number
  ingredient_id: number
  ingredient: Ingredient
  quantity: number
  notes?: string
  sub_total: number // calories * quantity
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
  staff_id?: number 
  ranking?: number
  feedback?: string
}

export interface QuickOrderTemplate {
  id: number
  name: string
  items: OrderItem[]
  total_calories: number
  total_price: number
  created_at: Date
  usage_count: number
}

interface KitchenState {
  currentStep: keyof typeof ORDER_STEPS
  orderDraft: Order
  orderHistory: Order[]
  quickOrders: QuickOrderTemplate[]
  
  ingredients: Record<keyof typeof INGREDIENT_CATEGORIES, Ingredient[]>
  dishes: Dish[]
  categories: { id: number; name: string; description?: string }[]
  
  activeOrders: Order[]
  assignedOrders: Order[]
  kitchenAlerts: string[]
  
  revenueData: {
    today: number
    week: number
    month: number
    year: number
    orders_count: number
  }
  ingredientStock: Record<number, { current: number; low_threshold: number }>
  
  loading: {
    orderBuilder: boolean
    ingredients: boolean
    orders: boolean
    analytics: boolean
  }

  startNewOrder: () => void
  setCurrentStep: (step: keyof typeof ORDER_STEPS) => void
  addIngredient: (ingredient: Ingredient, step: keyof typeof ORDER_STEPS, quantity?: number) => void
  removeIngredient: (ingredientId: number, step: keyof typeof ORDER_STEPS) => void
  updateIngredientQuantity: (ingredientId: number, step: keyof typeof ORDER_STEPS, quantity: number) => void
  updateOrderNote: (note: string) => void
  calculateNutrition: () => void
  getAISuggestions: () => Promise<void>
  completeOrder: (paymentMethod: "online" | "cod") => Promise<void>
  
  fetchOrderHistory: (userId: number, page?: number, limit?: number) => Promise<void>
  reorder: (orderId: number) => Promise<void>
  rateOrder: (orderId: number, rating: number, feedback?: string) => Promise<void>

  fetchActiveOrders: () => Promise<void>
  claimOrder: (orderId: number) => Promise<void>
  updateOrderStatus: (orderId: number, status: Order["status"]) => Promise<void>
  confirmPayment: (orderId: number, amount: number) => Promise<void>

  fetchAnalytics: (dateRange?: { start: Date; end: Date }) => Promise<void>
  updateIngredientStock: (ingredientId: number, quantity: number, type: "add" | "remove") => Promise<void>
  toggleIngredientAvailability: (ingredientId: number, available: boolean) => Promise<void>

  clearError: () => void
  setLoading: (key: keyof KitchenState["loading"], value: boolean) => void
}

export const useKitchenStore = create<KitchenState>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          currentStep: ORDER_STEPS.RICE,
          orderDraft: {
            customer_id: 0,
            customer_name: "",
            items: [],
            total_calories: 0,
            total_price: 0,
            status: "pending",
            payment_method: "online",
            final_price: 0,
            created_at: new Date(),
          },
          orderHistory: [],
          quickOrders: [],
          
          ingredients: {
            [INGREDIENT_CATEGORIES.RICE]: [],
            [INGREDIENT_CATEGORIES.PROTEIN]: [],
            [INGREDIENT_CATEGORIES.VEGETABLES]: [],
            [INGREDIENT_CATEGORIES.SOUP]: [],
            [INGREDIENT_CATEGORIES.DESSERT]: [],
          },
          dishes: [],
          categories: [],
          
          activeOrders: [],
          assignedOrders: [],
          kitchenAlerts: [],
          
          revenueData: {
            today: 0,
            week: 0,
            month: 0,
            year: 0,
            orders_count: 0,
          },
          ingredientStock: {},
          
          loading: {
            orderBuilder: false,
            ingredients: false,
            orders: false,
            analytics: false,
          },
          startNewOrder: () => {
            set({
              currentStep: ORDER_STEPS.RICE,
              orderDraft: {
                customer_id: 0,
                customer_name: "",
                items: [],
                total_calories: 0,
                total_price: 0,
                status: "pending",
                payment_method: "online",
                final_price: 0,
                created_at: new Date(),
              },
            })
          },

          setCurrentStep: (step) => set({ currentStep: step }),

          addIngredient: (ingredient, step, quantity = 1) => {
            set((state) => {
              const existingItemIndex = state.orderDraft.items.findIndex(
                (item) => item.ingredient.id === ingredient.id && item.step === step
              )
              
              let newItems
              if (existingItemIndex > -1) {
                const updatedItems = [...state.orderDraft.items]
                updatedItems[existingItemIndex] = {
                  ...updatedItems[existingItemIndex],
                  quantity: updatedItems[existingItemIndex].quantity + quantity,
                }
                newItems = updatedItems
              } else {
                newItems = [
                  ...state.orderDraft.items,
                  {
                    id: Date.now(),
                    ingredient_id: ingredient.id,
                    ingredient,
                    quantity,
                    step,
                    notes: "",
                    sub_total: ingredient.calories_per_unit * quantity,
                  },
                ]
              }

              const totalCalories = newItems.reduce(
                (sum, item) => sum + item.sub_total,
                0
              )
              const totalPrice = newItems.reduce(
                (sum, item) => sum + (item.ingredient.price_per_unit * item.quantity),
                0
              )

              return {
                orderDraft: {
                  ...state.orderDraft,
                  items: newItems,
                  total_calories: totalCalories,
                  total_price: totalPrice,
                },
              }
            })
          },

          removeIngredient: (ingredientId, step) => {
            set((state) => {
              const filteredItems = state.orderDraft.items.filter(
                (item) => !(item.ingredient.id === ingredientId && item.step === step)
              )

              const totalCalories = filteredItems.reduce(
                (sum, item) => sum + item.sub_total,
                0
              )
              const totalPrice = filteredItems.reduce(
                (sum, item) => sum + (item.ingredient.price_per_unit * item.quantity),
                0
              )

              return {
                orderDraft: {
                  ...state.orderDraft,
                  items: filteredItems,
                  total_calories: totalCalories,
                  total_price: totalPrice,
                },
              }
            })
          },

          updateIngredientQuantity: (ingredientId, step, quantity) => {
            set((state) => {
              const updatedItems = state.orderDraft.items.map((item) =>
                item.ingredient.id === ingredientId && item.step === step
                  ? {
                      ...item,
                      quantity,
                      sub_total: item.ingredient.calories_per_unit * quantity,
                    }
                  : item
              )

              const totalCalories = updatedItems.reduce(
                (sum, item) => sum + item.sub_total,
                0
              )
              const totalPrice = updatedItems.reduce(
                (sum, item) => sum + (item.ingredient.price_per_unit * item.quantity),
                0
              )

              return {
                orderDraft: {
                  ...state.orderDraft,
                  items: updatedItems,
                  total_calories: totalCalories,
                  total_price: totalPrice,
                },
              }
            })
          },

          updateOrderNote: (note) => {
            set((state) => ({
              orderDraft: {
                ...state.orderDraft,
                note,
              },
            }))
          },

          calculateNutrition: () => {
            const { orderDraft } = get()
            const nutrition = orderDraft.items.reduce(
              (acc, item) => {
                const nut = item.ingredient.nutrition || {
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  fiber: 0,
                  sugar: 0,
                  sodium: 0,
                }
                
                return {
                  protein: acc.protein + (nut.protein * item.quantity),
                  carbs: acc.carbs + (nut.carbs * item.quantity),
                  fat: acc.fat + (nut.fat * item.quantity),
                  fiber: acc.fiber + (nut.fiber * item.quantity),
                  sugar: acc.sugar + (nut.sugar * item.quantity),
                  sodium: acc.sodium + (nut.sodium * item.quantity),
                }
              },
              { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
            )

            set((state) => ({
              orderDraft: {
                ...state.orderDraft,
                nutrition,
              },
            }))

            return nutrition
          },

          getAISuggestions: async () => {
            set({ loading: { ...get().loading, orderBuilder: true } })

            try {
              const { orderDraft } = get()
              const itemsData = orderDraft.items.map(item => ({
                ...item.ingredient,
                quantity: item.quantity,
                category: item.step,
              }))

              const response = await bambiApi.post(API_ENDPOINTS.AI_ANALYZE, {
                items: itemsData,
                customer_preferences: get().user?.preferences || {},
              })

              const { health_score, nutrition_balance, suggestions, warnings } = response.data

              set((state) => ({
                orderDraft: {
                  ...state.orderDraft,
                  ai_analysis: {
                    health_score,
                    nutrition_balance,
                    suggestions,
                    warnings,
                  },
                },
                loading: { ...state.loading, orderBuilder: false },
              }))

              if (warnings.length > 0) {
                toast.warning("Cảnh báo dinh dưỡng", {
                  description: warnings[0],
                })
              }

              if (suggestions.length > 0) {
                toast.info("Gợi ý AI", {
                  description: suggestions[0],
                })
              }

            } catch (error) {
              set((state) => ({
                loading: { ...state.loading, orderBuilder: false },
              }))

              toast.error("Phân tích AI thất bại", {
                description: "Không thể đưa ra gợi ý dinh dưỡng",
              })
            }
          },

          completeOrder: async (paymentMethod: "online" | "cod") => {
            set((state) => ({
              loading: { ...state.loading, orderBuilder: true },
            }))

            try {
              const { orderDraft, user } = get()
              
              if (!user) throw new Error("User not authenticated")

              const orderData: Omit<Order, "id" | "created_at" | "status"> = {
                customer_id: user.id,
                customer_name: user.name,
                items: orderDraft.items,
                total_calories: orderDraft.total_calories,
                total_price: orderDraft.total_price,
                paymentMethod,
                final_price: orderDraft.total_price,
                note: orderDraft.note,
                ai_analysis: orderDraft.ai_analysis,
              }

              const response = await bambiApi.post(API_ENDPOINTS.ORDER_CREATE, orderData)

              const createdOrder = response.data

              set((state) => ({
                orderHistory: [createdOrder, ...state.orderHistory.slice(0, 9)],
                loading: { ...state.loading, orderBuilder: false },
              }))

              toast.success("Đặt món thành công!", {
                description: `Đơn hàng #${createdOrder.id} đã được tạo`,
                action: {
                  label: "Xem đơn hàng",
                  onClick: () => window.location.href = `/orders/${createdOrder.id}`,
                },
              })

              get().startNewOrder()

              // Real-time notification cho staff
              if (paymentMethod === "cod") {
                // Trigger WebSocket notification
                // socket.emit('new_order', createdOrder)
              }

            } catch (error) {
              set((state) => ({
                loading: { ...state.loading, orderBuilder: false },
              }))

              const apiError = error as ApiError
              toast.error("Đặt món thất bại", {
                description: apiError.userFriendlyMessage,
              })

              throw error
            }
          },

          fetchOrderHistory: async (userId, page = 1, limit = 10) => {
            set((state) => ({
              loading: { ...state.loading, orders: true },
            }))

            try {
              const response = await bambiApi.get(API_ENDPOINTS.ORDERS, {
                params: { user_id: userId, page, limit, sort: "created_at", order: "desc" },
              })

              set({
                orderHistory: response.data,
                loading: s => ({ ...s, orders: false }),
              })

            } catch (error) {
              set((state) => ({
                loading: { ...state.loading, orders: false },
              }))

              toast.error("Không thể tải lịch sử đơn hàng")
            }
          },

          reorder: async (orderId) => {
            try {
              const response = await bambiApi.get(`${API_ENDPOINTS.ORDER_DETAIL}/${orderId}`)
              const order = response.data

              set((state) => {
                const orderItems = order.items.flatMap((item: any) => 
                  Array(item.quantity).fill().map(() => ({
                    id: Date.now() + Math.random(),
                    ingredient_id: item.ingredient_id,
                    ingredient: item.ingredient,
                    quantity: 1,
                    step: item.category as keyof typeof ORDER_STEPS,
                    notes: item.notes,
                    sub_total: item.ingredient.calories_per_unit,
                  }))
                )

                const totalCalories = orderItems.reduce((sum, item) => sum + item.sub_total, 0)
                const totalPrice = orderItems.reduce((sum, item) => 
                  sum + (item.ingredient.price_per_unit * item.quantity), 0
                )

                return {
                  orderDraft: {
                    ...state.orderDraft,
                    items: orderItems,
                    total_calories: totalCalories,
                    total_price: totalPrice,
                  },
                  currentStep: ORDER_STEPS.RICE,
                }
              })

              toast.success("Đã tải đơn hàng cũ", {
                description: "Bạn có thể chỉnh sửa trước khi đặt lại",
              })

            } catch (error) {
              toast.error("Không thể tải đơn hàng cũ")
            }
          },

          rateOrder: async (orderId, rating, feedback) => {
            try {
              await bambiApi.post(`${API_ENDPOINTS.ORDER_DETAIL}/${orderId}/feedback`, {
                rating,
                feedback,
              })

              set((state) => ({
                orderHistory: state.orderHistory.map(order =>
                  order.id === orderId 
                    ? { ...order, ranking: rating, feedback }
                    : order
                ),
              }))

              toast.success("Cảm ơn đánh giá của bạn!", {
                description: "Phản hồi giúp chúng tôi cải thiện dịch vụ",
              })

            } catch (error) {
              toast.error("Không thể gửi đánh giá")
            }
          },

          fetchActiveOrders: async () => {
            set((state) => ({
              loading: { ...state.loading, orders: true },
            }))

            try {
              const response = await bambiApi.get(API_ENDPOINTS.ACTIVE_ORDERS)
              
              set({
                activeOrders: response.data,
                loading: s => ({ ...s, orders: false }),
              })

              const newOrders = response.data.filter(order => 
                !state.activeOrders.some(existing => existing.id === order.id)
              )

              newOrders.forEach(order => {
                toast.info(`Đơn hàng mới #${order.id}`, {
                  description: `Từ ${order.customer_name}`,
                  action: {
                    label: "Nhận đơn",
                    onClick: () => get().claimOrder(order.id),
                  },
                })
              })

            } catch (error) {
              set((state) => ({
                loading: { ...state.loading, orders: false },
              }))
              toast.error("Không thể tải đơn hàng đang chờ")
            }
          },

          claimOrder: async (orderId) => {
            try {
              const { user } = useAuthStore.getState()
              await bambiApi.post(API_ENDPOINTS.CLAIM_ORDER(orderId), {
                staff_id: user?.id,
              })

              set((state) => ({
                activeOrders: state.activeOrders.map(order =>
                  order.id === orderId
                    ? { ...order, staff_id: user?.id, status: "preparing" }
                    : order
                ),
                assignedOrders: [
                  ...state.assignedOrders,
                  state.activeOrders.find(o => o.id === orderId)!
                ],
              }))

              toast.success("Đã nhận đơn hàng!", {
                description: "Bắt đầu chuẩn bị nguyên liệu",
              })

            } catch (error) {
              toast.error("Không thể nhận đơn hàng")
            }
          },

          updateOrderStatus: async (orderId, status) => {
            try {
              await bambiApi.patch(API_ENDPOINTS.ORDER_STATUS(orderId), { status })

              set((state) => ({
                activeOrders: state.activeOrders.map(order =>
                  order.id === orderId ? { ...order, status } : order
                ),
                assignedOrders: state.assignedOrders.map(order =>
                  order.id === orderId ? { ...order, status } : order
                ),
              }))

              toast.success(`Đã cập nhật trạng thái: ${status.toUpperCase()}`)

              // Real-time notification to customer
              if (status === "ready") {
                // socket.emit('order_ready', { orderId })
              }

            } catch (error) {
              toast.error("Cập nhật trạng thái thất bại")
            }
          },

          confirmPayment: async (orderId, amount) => {
            try {
              await bambiApi.post(`${API_ENDPOINTS.ORDER_DETAIL}/${orderId}/payment/confirm`, {
                amount_paid: amount,
                method: "cod",
              })

              set((state) => ({
                activeOrders: state.activeOrders.map(order =>
                  order.id === orderId 
                    ? { ...order, status: "delivered" }
                    : order
                ),
              }))

              toast.success("Xác nhận thanh toán thành công!", {
                description: `Đã nhận ${amount.toLocaleString()} VNĐ`,
              })

            } catch (error) {
              toast.error("Xác nhận thanh toán thất bại")
            }
          },

          fetchAnalytics: async (dateRange) => {
            set((state) => ({
              loading: { ...state.loading, analytics: true },
            }))

            try {
              const params = dateRange ? {
                start_date: dateRange.start.toISOString().split('T')[0],
                end_date: dateRange.end.toISOString().split('T')[0],
              } : {}

              const [revenueResponse, ordersResponse] = await Promise.all([
                bambiApi.get(API_ENDPOINTS.REVENUE, { params }),
                bambiApi.get(API_ENDPOINTS.ADMIN_ORDERS, { params }),
              ])

              set({
                revenueData: revenueResponse.data,
                orderHistory: ordersResponse.data,
                loading: s => ({ ...s, analytics: false }),
              })

            } catch (error) {
              set((state) => ({
                loading: { ...state.loading, analytics: false },
              }))
              toast.error("Không thể tải dữ liệu phân tích")
            }
          },

          updateIngredientStock: async (ingredientId, quantity, type) => {
            try {
              const delta = type === "add" ? quantity : -quantity
              
              await bambiApi.patch(`/ingredients/${ingredientId}/stock`, {
                quantity_change: delta,
              })

              set((state) => ({
                ingredientStock: {
                  ...state.ingredientStock,
                  [ingredientId]: {
                    ...state.ingredientStock[ingredientId],
                    current: state.ingredientStock[ingredientId]?.current + delta || delta,
                  },
                },
              }))

              toast.success(
                type === "add" 
                  ? `Đã thêm ${quantity} đơn vị nguyên liệu` 
                  : `Đã trừ ${quantity} đơn vị nguyên liệu`
              )

            } catch (error) {
              toast.error("Cập nhật tồn kho thất bại")
            }
          },

          toggleIngredientAvailability: async (ingredientId, available) => {
            try {
              await bambiApi.patch(`/ingredients/${ingredientId}/status`, { available })

              set((state) => ({
                ingredients: Object.fromEntries(
                  Object.entries(state.ingredients).map(([category, items]) => [
                    category,
                    items.map(item =>
                      item.id === ingredientId 
                        ? { ...item, status: available ? "active" : "inactive" }
                        : item
                    )
                  ])
                ),
              }))

              toast.success(
                available 
                  ? "Đã kích hoạt nguyên liệu" 
                  : "Đã ẩn nguyên liệu khỏi menu"
              )

            } catch (error) {
              toast.error("Cập nhật trạng thái thất bại")
            }
          },

          clearError: () => set({ error: null }),
          
          setLoading: (key, value) => {
            set((state) => ({
              loading: { ...state.loading, [key]: value },
            }))
          },
        }),
        {
          name: "bambi-kitchen-storage",
          partialize: (state) => ({
            orderDraft: state.orderDraft,
            quickOrders: state.quickOrders,
            orderHistory: state.orderHistory.slice(0, 10), 
          }),
          merge: (persistedState, currentState) => ({
            ...currentState,
            orderDraft: persistedState.orderDraft || currentState.orderDraft,
            quickOrders: persistedState.quickOrders || currentState.quickOrders,
            orderHistory: persistedState.orderHistory || currentState.orderHistory,
          }),
        }
      ),
      { name: "Bambi Kitchen Store" }
    )
  )
)