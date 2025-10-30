import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { NotificationFormSlice, NotificationStore } from "@/zustand/types/notification"
import { toast } from "sonner"

export const createNotificationFormSlice: StateCreator<
  NotificationStore,
  [],
  [],
  NotificationFormSlice
> = (set, get) => ({
  create: async (data) => {
    set({ loading: true, error: null })
    try {
      await bambiApi.post(API_ENDPOINTS.API_NOTIFICATIONS, {
        title: data.title,
        message: data.message ?? data.content,
        content: data.message ?? data.content,
        account: data.account,
        is_read: false
      })
      toast.success("Tạo thông báo thành công!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error creating notification:", error)
      const message = error?.response?.status === 500
        ? "Lỗi server. Không thể tạo thông báo. Vui lòng liên hệ admin."
        : error?.response?.data?.message || "Không thể tạo thông báo"
      set({ error: message, loading: false })
      toast.error(message)
      throw error
    }
  },
  
  update: async (data) => {
    set({ loading: true, error: null })
    try {
      await bambiApi.put(API_ENDPOINTS.API_NOTIFICATIONS, {
        id: data.id,
        title: data.title,
        message: data.message ?? data.content,
        content: data.message ?? data.content,
        account: data.account,
        is_read: data.read ?? data.is_read,
      })
      toast.success("Cập nhật thông báo thành công!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error updating notification:", error)
      const message = error?.response?.status === 500
        ? "Lỗi server. Không thể cập nhật thông báo."
        : error?.response?.data?.message || "Không thể cập nhật thông báo"
      set({ error: message, loading: false })
      toast.error(message)
      throw error
    }
  },
  
  remove: async (id) => {
    set({ loading: true, error: null })
    try {
      await bambiApi.delete(API_ENDPOINTS.API_NOTIFICATION_BY_ID(id))
      toast.success("Xóa thông báo thành công!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error deleting notification:", error)
      const message = error?.response?.status === 500
        ? "Lỗi server. Không thể xóa thông báo."
        : error?.response?.data?.message || "Không thể xóa thông báo"
      set({ error: message, loading: false })
      toast.error(message)
      throw error
    }
  },

  markAsRead: async (id) => {
    try {
      await bambiApi.patch(API_ENDPOINTS.API_NOTIFICATION_MARK_READ(id), {
        // PATCH, không cần body
      })
      toast.success("Đã đánh dấu là đã đọc!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error marking as read:", error)
      const message = error?.response?.status === 500
        ? "Lỗi server. Không thể đánh dấu đã đọc."
        : error?.response?.data?.message || "Không thể đánh dấu đã đọc"
      toast.error(message)
      throw error
    }
  },

  sendToAll: async (payload) => {
    try {
      await bambiApi.post("/api/notification/send-to-all", payload)
      toast.success("Đã gửi thông báo đến tất cả user!")
    } catch (error: any) {
      console.error("Error sending notification to all:", error)
      toast.error("Gửi thông báo thất bại!")
      throw error
    }
  },
  sendToExact: async (payload) => {
    try {
      await bambiApi.post("/api/notification/send-to-exact", payload)
      toast.success("Đã gửi thông báo đến đúng thiết bị!")
    } catch (error: any) {
      console.error("Error sending notification to exact device:", error)
      toast.error("Gửi thông báo thất bại!")
      throw error
    }
  },
  sendToDevice: async (payload) => {
    try {
      await bambiApi.post("/api/notification/send", payload)
      toast.success("Đã gửi thông báo đến user!")
    } catch (error: any) {
      console.error("Error sending notification to device:", error)
      toast.error("Gửi thông báo thất bại!")
      throw error
    }
  }
})

