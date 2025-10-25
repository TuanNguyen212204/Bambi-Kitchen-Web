import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { AccountListSlice, StoreAccount } from "@/zustand/types/account"
import type { Account } from "@models/account/account"

export const createAccountListSlice: StateCreator<AccountListSlice> = (set, get) => ({
  items: [],
  loading: false,
  error: null,
  query: "",
  
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const response = await bambiApi.get(API_ENDPOINTS.API_ACCOUNTS)
      const raw = response.data as Account[]
      const accounts: StoreAccount[] = raw.map((account) => ({
        ...account,
        name: account.name || 'Người dùng',
        mail: account.mail || 'Chưa có email',
        status: (account.active ?? true) ? "active" : "inactive"
      }))
      set({ items: accounts, loading: false })
    } catch {
      set({ 
        error: "Không thể tải danh sách tài khoản",
        loading: false 
      })
    }
  },
  
  searchByName: async (name: string) => {
    set({ loading: true, error: null, query: name })
    try {
      const response = await bambiApi.get(API_ENDPOINTS.API_ACCOUNTS, { params: { name } })
      const raw = response.data as Account[]
      const accounts: StoreAccount[] = raw.map((account) => ({
        ...account,
        name: account.name || 'Người dùng',
        mail: account.mail || 'Chưa có email',
        status: (account.active ?? true) ? "active" : "inactive"
      }))
      set({ items: accounts, loading: false })
    } catch {
      set({ 
        error: "Không thể tìm kiếm tài khoản",
        loading: false 
      })
    }
  },
  
  setQuery: (query: string) => {
    set({ query })
  },
  
  filteredItems: () => {
    const state = get() as unknown as { getFilteredItems: () => StoreAccount[] }
    return state.getFilteredItems()
  },
  
  clearError: () => {
    set({ error: null })
  }
})
