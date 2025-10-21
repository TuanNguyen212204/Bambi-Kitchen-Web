import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

export interface DishItem {
  id: number
  name: string
  price?: number
  imageUrl?: string
  public?: boolean
  active?: boolean
  usedQuantity?: number
  categoryId?: number
}

export interface DishListSlice {
  items: DishItem[]
  loading: boolean
  error?: string
  fetchAll: () => Promise<void>
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

  fetchAll: async () => {
    set({ loading: true, error: undefined })
    try {
      const { data } = await bambiApi.get<DishItem[]>(API_ENDPOINTS.API_DISHES as string)
      set({ items: Array.isArray(data) ? data : [], loading: false })
    } catch (e) {
      set({ loading: false, error: "Không tải được danh sách món ăn" })
    }
  },

  remove: async (id: number) => {
    try {
      set((s) => ({ items: s.items.filter((x) => x.id !== id) }))
    } catch {
    }
  },

  togglePublic: async (id: number) => {
    try {
      const { data } = await bambiApi.get<boolean>(API_ENDPOINTS.API_DISH_TOGGLE_PUBLIC(id))
      set((s) => ({ items: s.items.map((d) => (d.id === id ? { ...d, public: data } : d)) }))
    } catch {
      const { toast } = await import("sonner")
      toast.error("Đổi trạng thái công khai thất bại")
    }
  },

  toggleActive: async (id: number) => {
    try {
      const { data } = await bambiApi.get<boolean>(API_ENDPOINTS.API_DISH_TOGGLE_ACTIVE(id))
      set((s) => ({ items: s.items.map((d) => (d.id === id ? { ...d, active: data } : d)) }))
    } catch {
      const { toast } = await import("sonner")
      toast.error("Đổi trạng thái hoạt động thất bại")
    }
  },
})


