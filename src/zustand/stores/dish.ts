import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist, createJSONStorage } from "zustand/middleware"
import type { DishListSlice } from "@/zustand/slices/dish/list.slice"
import type { DishFormSlice } from "@/zustand/slices/dish/form.slice"
import type { DishFilterSlice } from "@/zustand/slices/dish/filter.slice"
import type { DishCategorySlice } from "@/zustand/slices/dish/category.slice"
import type { DishTemplateSlice } from "@/zustand/slices/dish/template.slice"
import { 
  createDishListSlice, 
  createDishFormSlice, 
  createDishFilterSlice, 
  createDishCategorySlice, 
  createDishTemplateSlice 
} from "@/zustand/slices/dish"

export type DishStore = DishListSlice & DishFormSlice & DishFilterSlice & DishCategorySlice & DishTemplateSlice & {
  getFilteredItems: () => ReturnType<() => DishListSlice["items"]>
}

export const useDishStore = create<DishStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get, store) => ({
          ...createDishListSlice(set, get, store),
          ...createDishFormSlice(set, get, store),
          ...createDishFilterSlice(set, get, store),
          ...createDishCategorySlice(set, get, store),
          ...createDishTemplateSlice(set, get, store),

          getFilteredItems: () => {
            const state = get()
            const q = (state as DishFilterSlice).query?.toLowerCase?.() || ""
            const catId = (state as DishFilterSlice).selectedCategoryId
            const status = (state as DishFilterSlice).statusFilter
            return (state as DishListSlice).items.filter((d) => {
              const byQ = !q || d.name.toLowerCase().includes(q)
              const byCat = !catId || d.categoryId === catId
              const byStatus = (
                status === "all" ||
                (status === "active" && (d.active ?? true)) ||
                (status === "inactive" && (d.active === false)) ||
                (status === "public" && (d.public === true)) ||
                (status === "private" && (d.public === false))
              )
              return byQ && byCat && byStatus
            })
          },
        }),
        {
          name: "bambi-dish-storage",
          storage: createJSONStorage(() => localStorage),
          partialize: (state: DishStore) => ({
            items: state.items,
            categories: state.categories,
            templates: state.templates,
          }),
        }
      )
    )
  )
)


