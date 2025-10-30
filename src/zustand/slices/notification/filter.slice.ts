import type { StateCreator } from "zustand"
import type { NotificationFilterSlice, NotificationStore, StoreNotification } from "@/zustand/types/notification"

export const createNotificationFilterSlice: StateCreator<
  NotificationStore,
  [],
  [],
  NotificationFilterSlice
> = (set, get) => ({
  selectedStatus: "all",
  selectedAccountId: undefined,
  sortBy: "date",
  
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setSortBy: (sort) => set({ sortBy: sort }),
  
  getFilteredItems: () => {
    const state = get()
    let filtered: StoreNotification[] = [...state.items]
    
    if (state.query) {
      filtered = filtered.filter((item) =>
        (item.title?.toLowerCase() || "").includes(state.query.toLowerCase()) ||
        ((item.message ?? item.content ?? "").toLowerCase().includes(state.query.toLowerCase()))
      )
    }
    
    if (state.selectedStatus === "read") {
      filtered = filtered.filter((item) => (item.read ?? item.is_read) === true)
    } else if (state.selectedStatus === "unread") {
      filtered = filtered.filter((item) => (item.read ?? item.is_read) === false)
    }
    
    if (state.selectedAccountId !== undefined) {
      filtered = filtered.filter((item) => item.account_id === state.selectedAccountId)
    }
    
    if (state.sortBy === "date") {
      const time = (it: StoreNotification) => {
        const v = it.createdAt ?? it.created_at
        return v ? new Date(v).getTime() : 0
      }
      filtered.sort((a, b) => time(b) - time(a))
    } else if (state.sortBy === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }
    
    return filtered
  }
})

