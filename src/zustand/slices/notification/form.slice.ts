import { API_ENDPOINTS, bambiApi } from "@/utils/api"
import type { NotificationFormSlice, NotificationStore } from "@/zustand/types/notification"
import { toast } from "sonner"
import type { StateCreator } from "zustand"

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
        message: data.message,
        content: data.message,
        account: data.account,
        is_read: false
      })
      toast.success("Tạo thông báo thành công!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error creating notification:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Không thể tạo thông báo"
      set({ error: message, loading: false })
      if (shouldToast(`notification_create_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  },
  
  update: async (data) => {
    set({ loading: true, error: null })
    try {
      await bambiApi.put(API_ENDPOINTS.API_NOTIFICATIONS, {
        id: data.id,
        title: data.title,
        message: data.message,
        content: data.message,
        account: data.account,
        is_read: data.read,
      })
      toast.success("Cập nhật thông báo thành công!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error updating notification:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Không thể cập nhật thông báo"
      set({ error: message, loading: false })
      if (shouldToast(`notification_update_${message}`)) {
        toast.error(message)
      }
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
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Không thể xóa thông báo"
      set({ error: message, loading: false })
      if (shouldToast(`notification_delete_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  },

  markAsRead: async (id) => {
    try {
      // PATCH với empty body - Authorization header sẽ được thêm tự động bởi interceptor
      await bambiApi.patch(API_ENDPOINTS.API_NOTIFICATION_MARK_READ(id), {})
      toast.success("Đã đánh dấu là đã đọc!")
      await get().fetchAll()
    } catch (error: any) {
      console.error("Error marking as read:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      
      // Kiểm tra lỗi CORS hoặc 403
      const status = error?.response?.status
      let message = extractErrorMessage(error) || "Không thể đánh dấu đã đọc"
      
      if (status === 403) {
        // Lỗi 403 có thể là do:
        // 1. CORS preflight bị block (OPTIONS request)
        // 2. User không có quyền truy cập endpoint này
        message = "Không có quyền đánh dấu đã đọc. Vui lòng kiểm tra lại hoặc liên hệ admin."
      } else if (status === 0 || error?.code === 'ERR_NETWORK') {
        // Lỗi network có thể là do CORS
        message = "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối."
      }
      
      if (shouldToast(`notification_mark_read_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  },

  sendToAll: async (payload: { title: string; message: string; deviceToken?: string; userId?: number }) => {
    try {
      await bambiApi.post(API_ENDPOINTS.API_NOTIFICATION_SEND_TO_ALL, payload)
      toast.success("Đã gửi thông báo đến tất cả user!")
    } catch (error: any) {
      console.error("Error sending notification to all:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Gửi thông báo thất bại!"
      if (shouldToast(`notification_send_all_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  },
  sendToExact: async (payload: { title: string; message: string; deviceToken?: string; userId?: number }) => {
    try {
      await bambiApi.post(API_ENDPOINTS.API_NOTIFICATION_SEND_TO_EXACT, payload)
      toast.success("Đã gửi thông báo đến đúng thiết bị!")
    } catch (error: any) {
      console.error("Error sending notification to exact device:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Gửi thông báo thất bại!"
      if (shouldToast(`notification_send_exact_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  },
  sendToDevice: async (payload: { title: string; message: string; deviceToken?: string; userId?: number }) => {
    try {
      await bambiApi.post(API_ENDPOINTS.API_NOTIFICATION_SEND, payload)
      toast.success("Đã gửi thông báo đến user!")
    } catch (error: any) {
      console.error("Error sending notification to device:", error)
      const { extractErrorMessage, shouldToast } = await import("@utils/errors")
      const message = extractErrorMessage(error) || "Gửi thông báo thất bại!"
      if (shouldToast(`notification_send_device_${message}`)) {
        toast.error(message)
      }
      throw error
    }
  }
})

