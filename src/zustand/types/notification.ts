import type { Account } from "@models/account/account"

export interface StoreNotification {
  id: number;
  title: string;
  message?: string;
  content?: string; // alias field API mới
  createdAt?: string; // alias cũ
  created_at?: string; // mới
  read?: boolean;
  is_read?: boolean;
  account?: import("@models/account/account").Account;
  account_id?: number;
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
  create: (data: { title: string; message: string; account: Account | null }) => Promise<void>
  update: (data: { id: number; title: string; message: string; account: Account | null; read: boolean }) => Promise<void>
  remove: (id: number) => Promise<void>
  markAsRead: (id: number) => Promise<void>
}

export interface NotificationStore extends NotificationListSlice, NotificationFilterSlice, NotificationFormSlice {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
}

