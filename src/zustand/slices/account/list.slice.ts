import type { StateCreator } from "zustand"
import { bambiApi } from "@/utils/api"
import type { AccountListSlice, StoreAccount } from "@/zustand/types/account"

export const createAccountListSlice: StateCreator<AccountListSlice> = (set, get) => ({
  items: [],
  loading: false,
  error: null,
  query: "",
  
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const response = await bambiApi.get("/api/account")
      const accounts: StoreAccount[] = (response.data as any[]).map((account: any) => ({
        ...account,
        name: account.name || account.fullName || account.username || account.displayName || 'Người dùng',
        mail: account.mail || account.email || account.emailAddress || 'Chưa có email',
        status: account.active ? "active" : "inactive"
      }))
      set({ items: accounts, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || "Không thể tải danh sách tài khoản",
        loading: false 
      })
    }
  },
  
  searchByName: async (name: string) => {
    set({ loading: true, error: null, query: name })
    try {
      const response = await bambiApi.get(`/api/account?name=${encodeURIComponent(name)}`)
      const accounts: StoreAccount[] = (response.data as any[]).map((account: any) => ({
        ...account,
        name: account.name || account.fullName || account.username || account.displayName || 'Người dùng',
        mail: account.mail || account.email || account.emailAddress || 'Chưa có email',
        status: account.active ? "active" : "inactive"
      }))
      set({ items: accounts, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || "Không thể tìm kiếm tài khoản",
        loading: false 
      })
    }
  },
  
  setQuery: (query: string) => {
    set({ query })
  },
  
  filteredItems: () => {
    const state = get() as any
    return state.getFilteredItems()
  },
  
  clearError: () => {
    set({ error: null })
  }
})
