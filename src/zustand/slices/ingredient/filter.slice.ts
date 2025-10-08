import type { StateCreator } from "zustand"
import type { IngredientFilterSlice, StoreIngredient } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientFilterSlice: StateCreator<IngredientFilterSlice, [], [], IngredientFilterSlice> = (set, get, _store) => ({
  selectedCategoryId: undefined,
  statusFilter: "all",
  stockFilter: "all",
  viewMode: "grid",
  sortBy: "priority",
  
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setStockFilter: (s) => set({ stockFilter: s }),
  setViewMode: (m) => set({ viewMode: m }),
  setSortBy: (s) => set({ sortBy: s }),
  
  getFilteredItems: () => {
    const state = get() as unknown as { items: StoreIngredient[]; selectedCategoryId?: number; statusFilter: string; stockFilter: string; sortBy: string }
    let filtered = state.items || []

    // Category filter
    if (state.selectedCategoryId) {
      filtered = filtered.filter((item: StoreIngredient) => 
        item.category === state.selectedCategoryId?.toString()
      )
    }

    // Status filter
    if (state.statusFilter !== "all") {
      const isActive = state.statusFilter === "active"
      filtered = filtered.filter((item: StoreIngredient) => item.active === isActive)
    }

    // Stock filter
    if (state.stockFilter !== "all") {
      filtered = filtered.filter((item: StoreIngredient) => {
        if (!item.stockStatus) return false
        return item.stockStatus === state.stockFilter
      })
    }

    // Sort
    filtered.sort((a: StoreIngredient, b: StoreIngredient) => {
      switch (state.sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name)
        case "name_desc":
          return b.name.localeCompare(a.name)
        case "stock_asc":
          return (a.stock || 0) - (b.stock || 0)
        case "stock_desc":
          return (b.stock || 0) - (a.stock || 0)
        case "priority":
        default: {
          // Priority: out of stock first, then low stock, then normal
          const stockOrder = { out: 0, low: 1, normal: 2 }
          const aOrder = stockOrder[a.stockStatus as keyof typeof stockOrder] ?? 3
          const bOrder = stockOrder[b.stockStatus as keyof typeof stockOrder] ?? 3
          if (aOrder !== bOrder) return aOrder - bOrder
          return a.name.localeCompare(b.name)
        }
      }
    })

    return filtered
  },
})
