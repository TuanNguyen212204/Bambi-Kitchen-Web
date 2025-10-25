import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

export type TemplateSize = "S" | "M" | "L"

export interface DishTemplateItem {
  size: TemplateSize
  name: string
  priceRatio: number
  quantityRatio: number
  max_Carb?: number
  max_Protein?: number
  max_Vegetable?: number
}

export interface DishTemplateSlice {
  templates: DishTemplateItem[]
  loadingTemplates: boolean
  fetchTemplates: () => Promise<void>
  upsertTemplate: (payload: DishTemplateItem) => Promise<void>
  removeTemplate: (size: TemplateSize) => Promise<void>
}

export const createDishTemplateSlice: StateCreator<
  DishTemplateSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishTemplateSlice
> = (set) => ({
  templates: [],
  loadingTemplates: false,
  fetchTemplates: async () => {
    set({ loadingTemplates: true })
    try {
      const { data } = await bambiApi.get<DishTemplateItem[]>(API_ENDPOINTS.API_DISH_TEMPLATES)
      set({ templates: Array.isArray(data) ? data : [], loadingTemplates: false })
    } catch {
      set({ loadingTemplates: false })
      const { toast } = await import("sonner")
      toast.error("Không thể tải mẫu tô")
    }
  },
  upsertTemplate: async (payload) => {
    try {
      await bambiApi.post(API_ENDPOINTS.API_DISH_TEMPLATES, payload)
      set((s) => {
        const exists = s.templates.some((t) => t.size === payload.size)
        return { templates: exists ? s.templates.map((t) => (t.size === payload.size ? payload : t)) : [payload, ...s.templates] }
      })
      const { toast } = await import("sonner")
      toast.success("Đã lưu mẫu tô")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Lưu mẫu tô thất bại")
    }
  },
  removeTemplate: async (size) => {
    try {
      await bambiApi.delete(API_ENDPOINTS.API_DISH_TEMPLATE_BY_SIZE(size))
      set((s) => ({ templates: s.templates.filter((t) => t.size !== size) }))
      const { toast } = await import("sonner")
      toast.success("Đã xóa mẫu tô")
    } catch {
      const { toast } = await import("sonner")
      toast.error("Xóa mẫu tô thất bại")
    }
  },
})


