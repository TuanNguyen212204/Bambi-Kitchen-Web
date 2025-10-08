import type { StateCreator } from "zustand"
import type { IngredientCategorySlice, IngredientCategory } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientCategorySlice: StateCreator<IngredientCategorySlice, [], [], IngredientCategorySlice> = (set, _get, _store) => ({
  categories: [],
  
  fetchCategories: async () => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.get<IngredientCategory[]>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES)
      set({ categories: res.data })
    } catch {
      const { toast } = await import("sonner")
      toast.error("Không thể tải danh mục")
    }
  },

  createCategory: async (payload) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.post<IngredientCategory>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, payload)
      set((state) => ({ categories: [res.data, ...state.categories] })) 
      const { toast } = await import("sonner")
      toast.success("Đã tạo danh mục")
      return res.data
    } catch {
      const { toast } = await import("sonner")
      toast.error("Tạo danh mục thất bại")
      return undefined
    }
  },
})
