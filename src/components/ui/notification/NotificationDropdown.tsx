import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Clock, User } from "lucide-react"
import { useNotificationStore } from "@zustand/stores/notification"
import { useAuthStore } from "@zustand/stores/auth"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationItem {
  id: number
  title: string
  message: string
  createdAt: string
  read: boolean
  account?: {
    id: number
    name: string
    mail: string
  }
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { items: adminNotifications, markAsRead } = useNotificationStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizeField = (n: any) => ({
    ...n,
    read: typeof n.read !== "undefined" ? n.read : n.is_read,
    message: n.message ?? n.content ?? "",
    createdAt: n.createdAt ?? n.created_at,
    account: n.account,
  });

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      if (user.role_id === 1) {
        setNotifications(adminNotifications.map(normalizeField));
      } else {
        const response = await bambiApi.get(API_ENDPOINTS.API_NOTIFICATION_BY_ACCOUNT(user.id));
        if (response.data && Array.isArray(response.data)) {
          setNotifications(response.data.map(normalizeField));
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, user?.id])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      if (user?.role_id === 1) {
        await markAsRead(notificationId);
      } else {
        await bambiApi.patch(API_ENDPOINTS.API_NOTIFICATION_MARK_READ(notificationId));
      }
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length
  const recentNotifications = notifications.slice(0, 5)

  if (!isOpen) return null

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Thông báo</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                {unreadCount} mới
              </span>
            )}
            <Bell size={16} className="text-gray-500" />
          </div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm">Đang tải...</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <CheckCircle size={14} className="text-blue-500" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi
                        })}
                      </span>
                      {notification.account && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{notification.account.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 5 && (
        <div className="p-3 border-t border-gray-100">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  )
}
