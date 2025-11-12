import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@components/ui/badge"
import { useNotificationStore } from "@zustand/stores/notification"
import { useAuthStore } from "@zustand/stores/auth"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

interface NotificationIconProps {
  className?: string
  onClick?: () => void
}

export default function NotificationIcon({ className = "", onClick }: NotificationIconProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { fetchAll, items } = useNotificationStore()

  const fetchNotifications = async (signal?: AbortSignal) => {
    if (!user?.id) return
    
    // Không gọi API nếu đang redirect đến payment gateway
    try {
      if (sessionStorage.getItem("bambi-payment-redirecting") === "true") {
        return
      }
    } catch {
      // ignore storage errors
    }
    
    setIsLoading(true)
    try {
      if (user.role_id === 1) {
        // Admin: fetch tất cả notifications từ store
        await fetchAll()
        // Unread count sẽ được cập nhật trong useEffect dưới
      } else {
        // User thường: fetch notifications của user đó
        const response = await bambiApi.get(API_ENDPOINTS.API_NOTIFICATION_BY_ACCOUNT(user.id), {
          signal,
        })
        if (response.data && Array.isArray(response.data)) {
          // Chuẩn hóa và đếm unread notifications
          const unreadNotifications = response.data.filter((notification: any) => {
            // Hỗ trợ cả read và is_read field
            const isRead = typeof notification.read !== 'undefined' 
              ? notification.read 
              : notification.is_read
            return !isRead
          })
          setUnreadCount(unreadNotifications.length)
        } else {
          setUnreadCount(0)
        }
      }
    } catch (error) {
      // Ignore abort/canceled errors - không cần log vì đây là behavior bình thường
      if (error && typeof error === 'object') {
        // Check nhiều cách để detect canceled/aborted request
        const errorName = 'name' in error ? error.name : undefined
        const errorCode = 'code' in error ? error.code : undefined
        const errorMessage = 'message' in error ? String(error.message) : ''
        
        if (
          errorName === 'AbortError' || 
          errorName === 'CanceledError' ||
          errorCode === 'ERR_CANCELED' ||
          errorMessage.toLowerCase().includes('canceled') ||
          errorMessage.toLowerCase().includes('aborted')
        ) {
          return // Ignore canceled errors silently
        }
      }
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    
    let mounted = true
    // Không abort call đầu tiên khi user?.id thay đổi, chỉ abort khi component unmount
    // Tạo controller riêng cho call đầu tiên
    const initialController = new AbortController()
    
    // Delay nhỏ để tránh race condition khi user vừa login
    const timeoutId = setTimeout(() => {
      if (mounted && user?.id) {
        fetchNotifications(initialController.signal)
      }
    }, 100)
    
    // Chỉ polling khi user đã đăng nhập và component vẫn còn mounted
    // Tăng interval lên 60 giây để giảm tải server
    const interval = setInterval(() => {
      // Kiểm tra lại user?.id và mounted trước khi fetch để tránh gọi API không cần thiết
      if (mounted && user?.id) {
        // Tạo controller mới cho mỗi interval call để tránh abort các calls trước đó
        const intervalController = new AbortController()
        fetchNotifications(intervalController.signal)
      }
    }, 60000) // Tăng từ 30s lên 60s
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      clearInterval(interval)
      // Chỉ abort initial controller khi component unmount, không abort khi user?.id thay đổi
      // Vì khi user?.id thay đổi, useEffect sẽ chạy lại và tạo controller mới
      // Nhưng call cũ vẫn có thể đang chạy, nên không abort nó
      initialController.abort()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.role_id === 1 && items) {
      // Chuẩn hoá kiểm đếm lấy đúng unread
      const unreadCount = items.filter(item => !(item.read ?? item.is_read)).length
      setUnreadCount(unreadCount)
    }
  }, [items, user?.role_id])

  return (
    <div className="relative">
      <button
        className={`w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50 transition-colors ${className}`}
        onClick={onClick}
        aria-label="Thông báo"
        disabled={isLoading}
      >
        <Bell size={18} className={isLoading ? "animate-pulse" : ""} />
      </button>
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white p-0 flex items-center justify-center text-xs font-bold">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  )
}
