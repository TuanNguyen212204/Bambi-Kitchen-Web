import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { ApiError } from "@utils/errors"
import { useAuthStore } from "@zustand/stores/auth"
import type { 
  KitchenState, 
  Order, 
  OrderItem, 
  Ingredient, 
  QuickOrderTemplate
} from "@/zustand/types"
import { ORDER_STEPS } from "@/zustand/types"

export const useKitchenStore = create<KitchenState>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          // Initial state
          activeOrders: [],
          assignedOrders: [],
          orderHistory: [],
          currentOrder: null,
          
          currentStep: ORDER_STEPS.RICE,
          note: "",
          
          ingredients: [],
          availableIngredients: [],
          lowStockIngredients: [],
          
          quickOrderTemplates: [],
          
          loading: {
            orders: false,
            ingredients: false,
            analytics: false,
            aiSuggestions: false,
          },

          // Orders Actions
          fetchActiveOrders: async () => {
            set((state) => ({ loading: { ...state.loading, orders: true } }))
            
            try {
              const response = await bambiApi.get<Order[]>(API_ENDPOINTS.ORDERS)
              const newOrders = response.data.filter(order => 
                order.status === "pending" || order.status === "preparing"
              )
              
              set((state) => ({
                activeOrders: newOrders,
                loading: { ...state.loading, orders: false }
              }))
              
            } catch (e) {
              const apiError = e as ApiError
              set((state) => ({ 
                loading: { ...state.loading, orders: false }
              }))
              toast.error("Không thể tải danh sách đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          fetchOrderHistory: async () => {
            set((state) => ({ loading: { ...state.loading, orders: true } }))
            
            try {
              const response = await bambiApi.get<Order[]>(API_ENDPOINTS.ORDERS)
              
              set((state) => ({
                orderHistory: response.data,
                loading: { ...state.loading, orders: false }
              }))
              
            } catch (e) {
              const apiError = e as ApiError
              set((state) => ({ 
                loading: { ...state.loading, orders: false }
              }))
              toast.error("Không thể tải lịch sử đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          claimOrder: async (orderId) => {
            try {
              await bambiApi.post(API_ENDPOINTS.ORDER_DETAIL(String(orderId)) + "/claim")
              
              set((state) => ({
                assignedOrders: [...state.assignedOrders, 
                  state.activeOrders.find(o => o.id === orderId)!
                ],
                activeOrders: state.activeOrders.filter(o => o.id !== orderId)
              }))
              
              toast.success("Nhận đơn hàng thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể nhận đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          updateOrderStatus: async (orderId, status) => {
            try {
              await bambiApi.put(API_ENDPOINTS.ORDER_DETAIL(String(orderId)), { status })
              
              set((state) => ({
                activeOrders: state.activeOrders.map(o => 
                  o.id === orderId ? { ...o, status } : o
                ),
                assignedOrders: state.assignedOrders.map(o => 
                  o.id === orderId ? { ...o, status } : o
                )
              }))
              
              toast.success("Cập nhật trạng thái đơn hàng thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể cập nhật trạng thái", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          confirmPayment: async (orderId) => {
            try {
              await bambiApi.post(API_ENDPOINTS.ORDER_DETAIL(String(orderId)) + "/confirm-payment")
              
              toast.success("Xác nhận thanh toán thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể xác nhận thanh toán", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          completeOrder: async (orderId, paymentMethod) => {
            try {
              const user = useAuthStore.getState().user
              if (!user) throw new Error("User not authenticated")
              
              await bambiApi.post<Order>(
                API_ENDPOINTS.ORDER_DETAIL(String(orderId)) + "/complete",
                { paymentMethod }
              )
              
              set((state) => ({
                activeOrders: state.activeOrders.filter(o => o.id !== orderId),
                assignedOrders: state.assignedOrders.filter(o => o.id !== orderId)
              }))
              
              toast.success("Hoàn thành đơn hàng thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể hoàn thành đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          // Builder Actions
          setCurrentStep: (step) => set({ currentStep: step }),
          setNote: (note) => set({ note }),

          addIngredientToOrder: (ingredient, quantity, notes) => {
            const newItem: OrderItem = {
              id: Date.now(),
              ingredient_id: ingredient.id,
              ingredient,
              quantity,
              notes,
              sub_total: ingredient.calories_per_unit * quantity,
              step: get().currentStep
            }
            
            set((state) => ({
              currentOrder: state.currentOrder ? {
                ...state.currentOrder,
                items: [...state.currentOrder.items, newItem]
              } : {
                customer_id: useAuthStore.getState().user?.id || 0,
                customer_name: useAuthStore.getState().user?.name || "",
                items: [newItem],
                total_calories: 0,
                total_price: 0,
                status: "pending",
                payment_method: "online",
                final_price: 0,
                created_at: new Date()
              }
            }))
          },

          removeIngredientFromOrder: (ingredientId) => {
            set((state) => ({
              currentOrder: state.currentOrder ? {
                ...state.currentOrder,
                items: state.currentOrder.items.filter(item => 
                  item.ingredient_id !== ingredientId
                )
              } : null
            }))
          },

          clearCurrentOrder: () => set({ currentOrder: null }),

          // Ingredients Actions
          fetchIngredients: async () => {
            set((state) => ({ loading: { ...state.loading, ingredients: true } }))
            
            try {
              const response = await bambiApi.get<Ingredient[]>(API_ENDPOINTS.INGREDIENT_STOCK)
              
              set((state) => ({
                ingredients: response.data,
                availableIngredients: response.data.filter(i => i.status === "active"),
                lowStockIngredients: response.data.filter(i => i.status === "low_stock"),
                loading: { ...state.loading, ingredients: false }
              }))
              
            } catch (e) {
              const apiError = e as ApiError
              set((state) => ({ 
                loading: { ...state.loading, ingredients: false }
              }))
              toast.error("Không thể tải danh sách nguyên liệu", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          toggleIngredientAvailability: async (ingredientId) => {
            try {
              await bambiApi.put(API_ENDPOINTS.INGREDIENT_STOCK + `/${ingredientId}/toggle`)
              
              set((state) => ({
                ingredients: state.ingredients.map(ingredient =>
                  ingredient.id === ingredientId
                    ? { ...ingredient, status: ingredient.status === "active" ? "inactive" : "active" }
                    : ingredient
                )
              }))
              
              toast.success("Cập nhật trạng thái nguyên liệu thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể cập nhật nguyên liệu", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          updateIngredientStock: async (ingredientId, quantity) => {
            try {
              await bambiApi.put(API_ENDPOINTS.INGREDIENT_STOCK + `/${ingredientId}/stock`, { quantity })
              
              toast.success("Cập nhật tồn kho thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể cập nhật tồn kho", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          // Quick Orders Actions
          fetchQuickOrderTemplates: async () => {
            try {
              const response = await bambiApi.get<QuickOrderTemplate[]>(API_ENDPOINTS.ORDERS + "/templates")
              
              set({ quickOrderTemplates: response.data })
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể tải mẫu đơn hàng nhanh", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          createQuickOrderFromTemplate: async (templateId) => {
            try {
              const template = get().quickOrderTemplates.find(t => t.id === templateId)
              if (!template) throw new Error("Template not found")
              
              // Convert template to order
              const newOrder: Order = {
                customer_id: useAuthStore.getState().user?.id || 0,
                customer_name: useAuthStore.getState().user?.name || "",
                items: template.ingredients.map(ing => ({
                  id: Date.now() + Math.random(),
                  ingredient_id: ing.ingredient_id,
                  ingredient: get().ingredients.find(i => i.id === ing.ingredient_id)!,
                  quantity: ing.quantity,
                  notes: ing.notes,
                  sub_total: 0, // Will be calculated
                })),
                total_calories: template.estimated_calories,
                total_price: template.estimated_price,
                status: "pending",
                payment_method: "online",
                final_price: template.estimated_price,
                created_at: new Date()
              }
              
              set({ currentOrder: newOrder })
              toast.success("Tạo đơn hàng từ mẫu thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể tạo đơn hàng từ mẫu", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          // AI & Analytics Actions
          getAISuggestions: async (orderData) => {
            set((state) => ({ loading: { ...state.loading, aiSuggestions: true } }))
            
            try {
              const user = useAuthStore.getState().user
              if (!user) throw new Error("User not authenticated")
              
              await bambiApi.post(
                API_ENDPOINTS.AI_SUGGESTIONS,
                {
                  ...orderData,
                  customer_preferences: user
                }
              )
              
              set((state) => ({ loading: { ...state.loading, aiSuggestions: false } }))
              
            } catch (e) {
              const apiError = e as ApiError
              set((state) => ({ loading: { ...state.loading, aiSuggestions: false } }))
              toast.error("Không thể lấy gợi ý AI", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          fetchAnalytics: async (dateRange) => {
            set((state) => ({ loading: { ...state.loading, analytics: true } }))
            
            try {
              await bambiApi.get(API_ENDPOINTS.ORDERS + "/analytics", {
                params: dateRange
              })
              
              set((state) => ({ loading: { ...state.loading, analytics: false } }))
              
            } catch (e) {
              const apiError = e as ApiError
              set((state) => ({ loading: { ...state.loading, analytics: false } }))
              toast.error("Không thể tải dữ liệu phân tích", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          // Utility Actions
          reorder: async (orderId) => {
            try {
              const response = await bambiApi.get<Order>(
                API_ENDPOINTS.ORDER_DETAIL(String(orderId))
              )
              
              set({ currentOrder: response.data })
              toast.success("Tải lại đơn hàng thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể tải lại đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },

          rateOrder: async (orderId, rating, feedback) => {
            try {
              await bambiApi.post(API_ENDPOINTS.ORDER_DETAIL(String(orderId)) + "/rate", {
                rating,
                feedback
              })
              
              toast.success("Đánh giá đơn hàng thành công!")
              
            } catch (e) {
              const apiError = e as ApiError
              toast.error("Không thể đánh giá đơn hàng", {
                description: apiError.userFriendlyMessage
              })
            }
          },
        }),
        {
          name: "bambi-kitchen-storage",
          partialize: (state) => ({
            currentStep: state.currentStep,
            note: state.note,
            ingredients: state.ingredients,
          }),
        }
      )
    )
  )
)