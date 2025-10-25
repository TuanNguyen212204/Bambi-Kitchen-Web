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

  const fetchNotifications = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      if (user.role_id === 1) {
        await fetchAll()
      } else {
        const response = await bambiApi.get(API_ENDPOINTS.API_NOTIFICATION_BY_ACCOUNT(user.id))
        if (response.data && Array.isArray(response.data)) {
          const unreadNotifications = response.data.filter((notification: any) => !notification.read)
          setUnreadCount(unreadNotifications.length)
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    if (user?.role_id === 1 && items) {
      const unreadCount = items.filter(item => !item.read).length
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
