import type { StateCreator } from "zustand"
import type { IngredientCategorySlice } from "@/zustand/types"
import type { IngredientCategory } from "@models/category/category"

export const createIngredientCategorySlice: StateCreator<IngredientCategorySlice, [], [], IngredientCategorySlice> = (set) => ({
  categories: [],
  
  fetchCategories: async () => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.get<IngredientCategory[]>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES)
      set({ categories: res.data })
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Không thể tải danh mục")
    }
  },

  createCategory: async (payload: { name: string; description?: string; priority?: number }) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.post<IngredientCategory>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, payload)
      set((state) => ({ categories: [res.data, ...state.categories] })) 
      const { toast } = await import("sonner")
      toast.success("Đã tạo danh mục")
      return res.data
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Tạo danh mục thất bại")
      return undefined
    }
  },

  updateCategory: async (payload: { id: number; name: string; description?: string; priority?: number }) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.put<IngredientCategory>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, payload)
      set((state) => ({ categories: state.categories.map(c => c.id === res.data.id ? res.data : c) }))
      const { toast } = await import("sonner")
      toast.success("Đã cập nhật danh mục")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Cập nhật danh mục thất bại")
    }
  },

  removeCategory: async (id: number) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.delete(API_ENDPOINTS.API_INGREDIENT_CATEGORY_BY_ID(id), {
        headers: { 'x-silent-error': '1' }
      })
      if (!(res.status >= 200 && res.status < 300)) throw new Error("Delete failed")
      const list = await bambiApi.get<IngredientCategory[]>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, {
        headers: { 'x-silent-error': '1' }
      })
      set({ categories: list.data ?? [] })
      const { toast } = await import("sonner")
      toast.success("Đã xóa danh mục")
    } catch (e: any) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      const msg = extractErrorMessage(e) || "Xóa danh mục thất bại. Có thể danh mục đang được sử dụng."
      toast.error(msg)
    }
  },
})
