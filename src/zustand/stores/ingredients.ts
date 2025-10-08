import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist, createJSONStorage } from "zustand/middleware"
import type { IngredientStore } from "@/zustand/types"
import { 
  createIngredientListSlice,
  createIngredientCategorySlice,
  createIngredientFormSlice,
  createIngredientStockSlice,
  createIngredientFilterSlice
} from "@/zustand/slices/ingredient"

export const useIngredientStore = create<IngredientStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get, store) => ({
          ...createIngredientListSlice(set, get, store),
          ...createIngredientCategorySlice(set, get, store),
          ...createIngredientFormSlice(set, get, store),
          ...createIngredientStockSlice(set, get, store),
          ...createIngredientFilterSlice(set, get, store),
          
          filteredItems: () => {
            const state = get()
            return state.getFilteredItems()
          },
        }),
        {
          name: "bambi-ingredient-storage",
          storage: createJSONStorage(() => localStorage),
          partialize: (state: IngredientStore) => ({
            items: state.items,
            categories: state.categories,
          }),
        }
      )
    )
  )
)