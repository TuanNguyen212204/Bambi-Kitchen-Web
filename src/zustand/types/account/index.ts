import type { Account } from "@models/account/account"

// Account types
export type AccountRole = "ADMIN" | "STAFF" | "USER"
export type AccountStatus = "active" | "inactive"

export interface StoreAccount extends Omit<Account, "createAt" | "updateAt"> {
  createAt?: string
  updateAt?: string
  status?: AccountStatus
}

export interface AccountCreateRequest {
  name: string
  mail: string
  role: AccountRole
  password: string
  phone?: string
}

export interface AccountUpdateRequest {
  id: number
  name: string
  mail: string
  role?: AccountRole
  active?: boolean
  phone?: string
}

// Slice types
export interface AccountListSlice {
  items: StoreAccount[]
  loading: boolean
  error: string | null
  query: string
  
  fetchAll: () => Promise<void>
  searchByName: (name: string) => Promise<void>
  setQuery: (query: string) => void
  filteredItems: () => StoreAccount[]
  clearError: () => void
}

export interface AccountFormSlice {
  create: (payload: AccountCreateRequest) => Promise<void>
  update: (payload: AccountUpdateRequest) => Promise<void>
  remove: (id: number) => Promise<void>
}

export interface AccountFilterSlice {
  selectedRole?: AccountRole
  statusFilter?: "all" | "active" | "inactive"
  viewMode: "grid" | "list"
  sortBy: "name_asc" | "name_desc" | "role_asc" | "role_desc" | "created_desc"
  
  setSelectedRole: (role?: AccountRole) => void
  setStatusFilter: (s: "all" | "active" | "inactive") => void
  setViewMode: (m: "grid" | "list") => void
  setSortBy: (s: AccountFilterSlice["sortBy"]) => void
  getFilteredItems: () => StoreAccount[]
}

export interface AccountStatsSlice {
  totalAccounts: number
  activeAccounts: number
  adminAccounts: number
  staffAccounts: number
  userAccounts: number
  
  fetchStats: () => Promise<void>
}

export type AccountStore = 
  AccountListSlice & 
  AccountFormSlice & 
  AccountFilterSlice & 
  AccountStatsSlice & {
  filteredItems: () => StoreAccount[]
}

export type AccountState = AccountStore
