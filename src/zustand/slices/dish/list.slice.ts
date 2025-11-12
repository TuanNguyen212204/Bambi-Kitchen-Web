import type { StateCreator } from "zustand"
import { bambiApi, bambiPublicApi, API_ENDPOINTS } from "@/utils/api"

export interface DishItem {
  id: number
  name: string
  price?: number
  imageUrl?: string
  description?: string
  public?: boolean
  active?: boolean
  usedQuantity?: number
  categoryId?: number
}

export interface DishListSlice {
  items: DishItem[]
  loading: boolean
  error?: string
  fetchAll: (filterType?: "all" | "menu" | "inactive") => Promise<void>
  remove: (id: number) => Promise<void>
  togglePublic: (id: number) => Promise<void>
  toggleActive: (id: number) => Promise<void>
}

export const createDishListSlice: StateCreator<
  DishListSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishListSlice
> = (set) => ({
  items: [],
  loading: false,
  error: undefined,

  fetchAll: async (filterType: "all" | "menu" | "inactive" = "all") => {
    set({ loading: true, error: undefined })
    try {
      // filterType "menu" -> dùng /api/dish (chỉ lấy public=true & active=true)
      // filterType "all" hoặc "inactive" -> dùng /api/dish/get-all (tất cả dishes cho admin)
      // Sau đó filter theo active=false nếu là "inactive"
      const endpoint = filterType === "menu" 
        ? API_ENDPOINTS.API_DISHES 
        : API_ENDPOINTS.API_DISHES_ALL

      let client = bambiApi
      if (filterType === "menu") {
        try {
          const { useAuthStore } = await import("@/zustand/stores/auth")
          const authToken = useAuthStore.getState().token
          client = authToken ? bambiApi : bambiPublicApi
        } catch {
          client = bambiPublicApi
        }
      }

      const { data } = await client.get<DishItem[]>(endpoint as string, {
        headers: { "x-silent-error": "1" },
      })
      let items = Array.isArray(data) ? data : []
      
      // Filter theo active=false nếu là "inactive"
      if (filterType === "inactive") {
        items = items.filter(d => d.active === false)
      }
      
      set({ items, loading: false })
    } catch (e) {
      const { extractErrorMessage } = await import("@utils/errors")
      set({ loading: false, error: extractErrorMessage(e) || "Không tải được danh sách món ăn" })
    }
  },

  remove: async (id: number) => {
    try {
      await bambiApi.get<boolean>(API_ENDPOINTS.API_DISH_TOGGLE_ACTIVE(id))
      set((s) => ({ items: s.items.filter((x) => x.id !== id) }))
      const { toast } = await import("sonner")
      toast.success("Đã xóa món ăn")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Xóa món ăn thất bại")
    }
  },

  togglePublic: async (id: number) => {
    try {
      const { data } = await bambiApi.get<boolean>(API_ENDPOINTS.API_DISH_TOGGLE_PUBLIC(id))
      set((s) => ({ items: s.items.map((d) => (d.id === id ? { ...d, public: data } : d)) }))
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Đổi trạng thái công khai thất bại")
    }
  },

  toggleActive: async (id: number) => {
    try {
      const { data } = await bambiApi.get<boolean>(API_ENDPOINTS.API_DISH_TOGGLE_ACTIVE(id))
      set((s) => ({ items: s.items.map((d) => (d.id === id ? { ...d, active: data } : d)) }))
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Đổi trạng thái hoạt động thất bại")
    }
  },
})


