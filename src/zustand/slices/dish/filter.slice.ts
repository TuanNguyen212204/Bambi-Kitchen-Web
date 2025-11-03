import type { StateCreator } from "zustand"

export interface DishFilterSlice {
  query: string
  statusFilter: "all" | "menu" | "inactive" // "all" = tất cả, "menu" = hiển thị menu, "inactive" = không hoạt động
  viewMode: "grid" | "list"
  setQuery: (q: string) => void
  setStatusFilter: (s: "all" | "menu" | "inactive") => void
  setViewMode: (m: "grid" | "list") => void
}

export const createDishFilterSlice: StateCreator<
  DishFilterSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishFilterSlice
> = (set) => ({
  query: "",
  statusFilter: "all",
  viewMode: "grid",
  setQuery: (q) => set({ query: q }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setViewMode: (m) => set({ viewMode: m }),
})


