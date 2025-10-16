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
})


