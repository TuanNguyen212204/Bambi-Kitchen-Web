import type { StateCreator } from "zustand"

export type DishStatusFilter = "all" | "active" | "inactive" | "public" | "private"

export interface DishFilterSlice {
  query: string
  selectedCategoryId?: number
  statusFilter: DishStatusFilter
  viewMode: "grid" | "list"
  setQuery: (q: string) => void
  setSelectedCategoryId: (id?: number) => void
  setStatusFilter: (s: DishStatusFilter) => void
  setViewMode: (m: "grid" | "list") => void
}

export const createDishFilterSlice: StateCreator<
  DishFilterSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishFilterSlice
> = (set) => ({
  query: "",
  selectedCategoryId: undefined,
  statusFilter: "all",
  viewMode: "grid",
  setQuery: (q) => set({ query: q }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setViewMode: (m) => set({ viewMode: m }),
})


