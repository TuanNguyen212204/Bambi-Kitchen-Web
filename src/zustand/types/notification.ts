import type { Account } from "@models/account/account"

export interface StoreNotification {
  id: number
  title: string
  message: string
  createdAt: string
  account?: Account
  read: boolean
  accountId?: number
}

export interface NotificationListSlice {
  items: StoreNotification[]
  loading: boolean
  error: string | null
  query: string
  
  fetchAll: () => Promise<void>
  searchByTitle: (title: string) => Promise<void>
  setQuery: (query: string) => void
  filteredItems: () => StoreNotification[]
  clearError: () => void
}

export interface NotificationFilterSlice {
  selectedStatus: "all" | "read" | "unread"
  selectedAccountId: number | undefined
  sortBy: "date" | "title"
  
  setSelectedStatus: (status: "all" | "read" | "unread") => void
  setSelectedAccountId: (id: number | undefined) => void
  setSortBy: (sort: "date" | "title") => void
  getFilteredItems: () => StoreNotification[]
}

export interface NotificationFormSlice {
  create: (data: { title: string; message: string; account: Account }) => Promise<void>
  update: (data: { id: number; title: string; message: string; account: Account; read: boolean }) => Promise<void>
  remove: (id: number) => Promise<void>
  markAsRead: (id: number) => Promise<void>
}

export interface NotificationStore extends NotificationListSlice, NotificationFilterSlice, NotificationFormSlice {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
}

