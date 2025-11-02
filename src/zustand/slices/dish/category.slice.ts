import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { DishCategory, DishCategoryCreateRequest, DishCategoryUpdateRequest } from "@/models/category/category"

export interface DishCategoryForm {
  id?: number
  name: string
  description?: string
}

export interface DishCategorySlice {
  categories: DishCategory[]
  fetchCategories: () => Promise<void>
  createCategory: (payload: Omit<DishCategoryForm, "id">) => Promise<void>
  updateCategory: (payload: DishCategoryForm) => Promise<void>
  removeCategory: (id: number) => Promise<void>
}

export const createDishCategorySlice: StateCreator<
  DishCategorySlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishCategorySlice
> = (set) => ({
  categories: [],
  fetchCategories: async () => {
    try {
      const { data } = await bambiApi.get<DishCategory[]>(API_ENDPOINTS.API_DISH_CATEGORIES)
      set({ categories: data })
    } catch {
      // Im lặng khi lỗi để tránh spam toast khi phiên hết hạn hoặc backend tạm thời lỗi
      set({ categories: [] })
    }
  },
  createCategory: async (payload) => {
    try {
      const createRequest: DishCategoryCreateRequest = {
        name: payload.name,
        description: payload.description
      }
      const { data } = await bambiApi.post<DishCategory>(API_ENDPOINTS.API_DISH_CATEGORIES, createRequest)
      set((s) => ({ categories: [data, ...s.categories] }))
      const { toast } = await import("sonner")
      toast.success("Đã tạo danh mục")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Tạo danh mục thất bại")
    }
  },
  updateCategory: async (payload) => {
    try {
      const updateRequest: DishCategoryUpdateRequest = {
        id: payload.id!,
        name: payload.name,
        description: payload.description
      }
      const { data } = await bambiApi.put<DishCategory>(API_ENDPOINTS.API_DISH_CATEGORIES, updateRequest)
      set((s) => ({ categories: s.categories.map((c) => (c.id === data.id ? data : c)) }))
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
      await bambiApi.delete(API_ENDPOINTS.API_DISH_CATEGORY_BY_ID(id))
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
      const { toast } = await import("sonner")
      toast.success("Đã xóa danh mục")
    } catch (error) {
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Xóa danh mục thất bại")
    }
  },
})


