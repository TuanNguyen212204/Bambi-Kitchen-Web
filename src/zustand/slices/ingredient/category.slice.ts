import type { StateCreator } from "zustand"
import type { IngredientCategorySlice, IngredientCategory } from "@/zustand/types"

export const createIngredientCategorySlice: StateCreator<IngredientCategorySlice, [], [], IngredientCategorySlice> = (set) => ({
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

  createCategory: async (payload: { name: string; description?: string }) => {
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

  updateCategory: async (payload: { id: number; name: string; description?: string }) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.put<IngredientCategory>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, payload)
      set((state) => ({ categories: state.categories.map(c => c.id === res.data.id ? res.data : c) }))
      const { toast } = await import("sonner")
      toast.success("Đã cập nhật danh mục")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Cập nhật danh mục thất bại")
    }
  },

  removeCategory: async (id: number) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.delete(API_ENDPOINTS.API_INGREDIENT_CATEGORY_BY_ID(id))
      set((state) => ({ categories: state.categories.filter(c => c.id !== id) }))
      const { toast } = await import("sonner")
      toast.success("Đã xóa danh mục")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Xóa danh mục thất bại")
    }
  },
})
