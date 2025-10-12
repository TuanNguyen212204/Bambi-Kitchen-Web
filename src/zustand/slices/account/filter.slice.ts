import type { StateCreator } from "zustand"
import type { AccountFilterSlice, AccountRole } from "@/zustand/types/account"

export const createAccountFilterSlice: StateCreator<AccountFilterSlice> = (set, get) => ({
  selectedRole: undefined,
  statusFilter: "all",
  viewMode: "grid",
  sortBy: "name_asc",
  
  setSelectedRole: (role?: AccountRole) => {
    set({ selectedRole: role })
  },
  
  setStatusFilter: (status: "all" | "active" | "inactive") => {
    set({ statusFilter: status })
  },
  
  setViewMode: (mode: "grid" | "list") => {
    set({ viewMode: mode })
  },
  
  setSortBy: (sortBy: AccountFilterSlice["sortBy"]) => {
    set({ sortBy })
  },
  
  getFilteredItems: () => {
    const state = get() as any
    let filtered = [...state.items]
    
    // Filter by role
    if (state.selectedRole) {
      filtered = filtered.filter(item => item.role === state.selectedRole)
    }
    
    // Filter by status
    if (state.statusFilter !== "all") {
      filtered = filtered.filter(item => {
        const isActive = item.active ?? true
        return state.statusFilter === "active" ? isActive : !isActive
      })
    }
    
    // Filter by search query
    if (state.query) {
      const query = state.query.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.mail.toLowerCase().includes(query) ||
        (item.phone && item.phone.includes(query))
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name)
        case "name_desc":
          return b.name.localeCompare(a.name)
        case "role_asc":
          return a.role.localeCompare(b.role)
        case "role_desc":
          return b.role.localeCompare(a.role)
        case "created_desc":
          const aDate = new Date(a.createAt || "").getTime()
          const bDate = new Date(b.createAt || "").getTime()
          return bDate - aDate
        default:
          return 0
      }
    })
    
    return filtered
  }
})
