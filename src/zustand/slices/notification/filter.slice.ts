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
        item.title.toLowerCase().includes(state.query.toLowerCase()) ||
        item.message.toLowerCase().includes(state.query.toLowerCase())
      )
    }
    
    if (state.selectedStatus === "read") {
      filtered = filtered.filter((item) => item.read === true)
    } else if (state.selectedStatus === "unread") {
      filtered = filtered.filter((item) => item.read === false)
    }
    
    if (state.selectedAccountId !== undefined) {
      filtered = filtered.filter((item) => item.accountId === state.selectedAccountId)
    }
    
    if (state.sortBy === "date") {
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (state.sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    }
    
    return filtered
  }
})

