import type { StateCreator } from "zustand"
import type { AccountStatsSlice } from "@/zustand/types/account"

export const createAccountStatsSlice: StateCreator<AccountStatsSlice> = (set, get) => ({
  totalAccounts: 0,
  activeAccounts: 0,
  adminAccounts: 0,
  staffAccounts: 0,
  userAccounts: 0,
  
  fetchStats: async () => {
    const state = get() as any
    const items = state.items as any[]
    
    const stats = {
      totalAccounts: items.length,
      activeAccounts: items.filter(item => item.active !== false).length,
      adminAccounts: items.filter(item => item.role === "ADMIN").length,
      staffAccounts: items.filter(item => item.role === "STAFF").length,
      userAccounts: items.filter(item => item.role === "USER").length,
    }
    
    set(stats)
  }
})
