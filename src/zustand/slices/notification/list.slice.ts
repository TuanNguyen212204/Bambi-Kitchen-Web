import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { NotificationListSlice, StoreNotification } from "@/zustand/types/notification"

export const createNotificationListSlice: StateCreator<NotificationListSlice> = (set, get) => ({
  items: [],
  loading: false,
  error: null,
  query: "",
  
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const response = await bambiApi.get(API_ENDPOINTS.API_NOTIFICATIONS)
      
      if (!response.data) {
        set({ items: [], loading: false })
        return
      }

      const raw = Array.isArray(response.data) ? response.data : []
      const notifications: StoreNotification[] = raw.map((notification) => ({
        id: notification.id,
        title: notification.title || 'Không có tiêu đề',
        message: notification.message || '',
        createdAt: notification.createdAt || new Date().toISOString(),
        account: notification.account,
        read: notification.read ?? false,
        accountId: notification.account?.id
      }))
      set({ items: notifications, loading: false })
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
      const errorMessage = error?.response?.status === 500 
        ? "Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin."
        : "Không thể tải danh sách thông báo"
      set({ 
        items: [],
        error: errorMessage,
        loading: false 
      })
    }
  },
  
  searchByTitle: async (title: string) => {
    set({ loading: true, error: null, query: title })
    try {
      const response = await bambiApi.get(API_ENDPOINTS.API_NOTIFICATIONS)
      
      if (!response.data) {
        set({ items: [], loading: false })
        return
      }

      const raw = Array.isArray(response.data) ? response.data : []
      const filtered = raw.filter((n) => 
        n.title?.toLowerCase().includes(title.toLowerCase())
      )
      const notifications: StoreNotification[] = filtered.map((notification) => ({
        id: notification.id,
        title: notification.title || 'Không có tiêu đề',
        message: notification.message || '',
        createdAt: notification.createdAt || new Date().toISOString(),
        account: notification.account,
        read: notification.read ?? false,
        accountId: notification.account?.id
      }))
      set({ items: notifications, loading: false })
    } catch (error: any) {
      console.error("Error searching notifications:", error)
      const errorMessage = error?.response?.status === 500 
        ? "Lỗi server. Vui lòng thử lại sau."
        : "Không thể tìm kiếm thông báo"
      set({ 
        items: [],
        error: errorMessage,
        loading: false 
      })
    }
  },
  
  setQuery: (query: string) => {
    set({ query })
  },
  
  filteredItems: () => {
    const state = get() as unknown as { getFilteredItems: () => StoreNotification[] }
    return state.getFilteredItems()
  },
  
  clearError: () => {
    set({ error: null })
  }
})

