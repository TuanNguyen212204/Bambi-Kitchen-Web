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
    const { data } = await bambiApi.get<DishCategory[]>(API_ENDPOINTS.API_DISH_CATEGORIES)
    set({ categories: data })
  },
  createCategory: async (payload) => {
    const createRequest: DishCategoryCreateRequest = {
      name: payload.name,
      description: payload.description
    }
    const { data } = await bambiApi.post<DishCategory>(API_ENDPOINTS.API_DISH_CATEGORIES, createRequest)
    set((s) => ({ categories: [data, ...s.categories] }))
  },
  updateCategory: async (payload) => {
    const updateRequest: DishCategoryUpdateRequest = {
      id: payload.id!,
      name: payload.name,
      description: payload.description
    }
    const { data } = await bambiApi.put<DishCategory>(API_ENDPOINTS.API_DISH_CATEGORIES, updateRequest)
    set((s) => ({ categories: s.categories.map((c) => (c.id === data.id ? data : c)) }))
  },
  removeCategory: async (id: number) => {
    await bambiApi.delete(API_ENDPOINTS.API_DISH_CATEGORY_BY_ID(id))
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },
})


