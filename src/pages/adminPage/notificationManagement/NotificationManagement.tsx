import { Card, CardContent } from "@components/ui/card/card"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Bell, CheckCircle, Mail, Calendar, Plus, Eye, MoreVertical, Trash2 as TrashIcon } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useNotificationStore } from "@zustand/stores/notification"
import { useAccountStore } from "@zustand/stores/account"
import AddNotificationModal from "@components/admin/notification/AddNotificationModal"
import NotificationDetailModal from "@components/admin/notification/NotificationDetailModal"
import { DeleteConfirmationModal } from "@components/ui/modal/DeleteConfirmationModal"

export default function NotificationManagement() {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  })

  const {
    fetchAll,
    loading,
    error,
    query,
    setQuery,
    searchByTitle,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    remove,
    markAsRead,
    getFilteredItems
  } = useNotificationStore()

  const { fetchAll: fetchAccounts } = useAccountStore()
  const store = useNotificationStore()
  
  const notifications = useMemo(() => getFilteredItems(), [store])
  const totalNotifications = useMemo(() => store.items.length, [store.items])
  const unreadNotifications = useMemo(() => store.items.filter(n => !n.read).length, [store.items])
  const readNotifications = useMemo(() => store.items.filter(n => n.read).length, [store.items])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [notificationToDelete, setNotificationToDelete] = useState<any>(null)

  useEffect(() => {
    fetchAll()
    fetchAccounts()
  }, [])

  const statsData = [
    {
      title: "Tổng thông báo",
      value: totalNotifications.toString(),
      subtitle: `${Math.floor(totalNotifications * 0.1)} thông báo mới tuần này`,
      icon: Bell,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Chưa đọc",
      value: unreadNotifications.toString(),
      subtitle: `${totalNotifications > 0 ? Math.round((unreadNotifications / totalNotifications) * 100) : 0}% tổng thông báo`,
      icon: Mail,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-amber-600",
    },
    {
      title: "Đã đọc",
      value: readNotifications.toString(),
      subtitle: `${totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0}% tổng thông báo`,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Trong tháng",
      value: totalNotifications.toString(),
      subtitle: "Tăng 15% so với tháng trước",
      icon: Calendar,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      subtitleColor: "text-green-600",
    },
  ]

  const handleViewDetail = (notification: any) => {
    setSelectedNotification(notification)
    setShowDetailModal(true)
  }

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await remove(notificationId)
      await fetchAll()
      setShowDeleteModal(false)
      setNotificationToDelete(null)
    } catch (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId)
      await fetchAll()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const openDeleteModal = (notification: any) => {
    setNotificationToDelete(notification)
    setShowDeleteModal(true)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Thông báo
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px] mb-4">
                      {stat.title}
                    </div>
                    <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                      {stat.value}
                    </div>
                    <div className={`[font-family:'Inter-Medium',Helvetica] font-medium text-sm leading-[21px] ${stat.subtitleColor}`}>
                      {stat.subtitle}
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Danh sách Thông báo
            </h2>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-auto px-3 py-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                Thêm thông báo mới
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm thông báo
              </label>
              <Input
                placeholder="Tiêu đề, nội dung..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Trạng thái
              </label>
              <Select value={selectedStatus} onValueChange={(value: "all" | "read" | "unread") => setSelectedStatus(value)}>
                <SelectTrigger className="bg-white h-auto py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="read">Đã đọc</SelectItem>
                  <SelectItem value="unread">Chưa đọc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm
              </label>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2"
                onClick={() => {
                  if (query.trim()) {
                    searchByTitle(query.trim())
                  } else {
                    fetchAll()
                  }
                }}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                  Tìm kiếm
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Danh sách Thông báo ({notifications.length} thông báo)
            </h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={`h-auto ${viewMode === "grid" ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-white text-black hover:bg-gray-50"} border border-solid px-3 py-2`}
                onClick={() => setViewMode("grid")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">
                  🔲 Grid
                </span>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="sm" 
                className={`h-auto ${viewMode === "list" ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-white text-black hover:bg-gray-50"} border-gray-300 px-3 py-2`}
                onClick={() => setViewMode("list")}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">
                  📋 List
                </span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {error ? "Không thể tải thông báo" : "Chưa có thông báo nào"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {error 
                  ? "Vui lòng kiểm tra kết nối hoặc thử lại sau" 
                  : "Hãy tạo thông báo đầu tiên của bạn"}
              </p>
              {error ? (
                <Button 
                  onClick={() => fetchAll()} 
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Thử lại
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowAddModal(true)} 
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo thông báo mới
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 gap-3"}>
              {notifications.map((notification) => (
                <Card key={notification.id} className="bg-white border-2 border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            (notification.read ?? notification.is_read)
                              ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px] mb-1 line-clamp-2" title={notification.title}>
                            {notification.title || 'Không có tiêu đề'}
                          </h3>
                          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[16px] opacity-75 line-clamp-2" title={notification.message || notification.content}>
                            {notification.message || notification.content || 'Không có nội dung'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <button
                            className="w-8 h-8 rounded hover:bg-black/10 flex items-center justify-center"
                            onClick={(e) => {
                              const menu = (e.currentTarget.nextSibling as HTMLElement)
                              if (menu) menu.classList.toggle('hidden')
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10 min-w-[120px]">
                            <button
                              className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap"
                              onClick={() => handleViewDetail(notification)}
                            >
                              <Eye className="w-4 h-4" /> Xem chi tiết
                            </button>
                            <button 
                              className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap" 
                              onClick={() => openDeleteModal(notification)}
                            >
                              <TrashIcon className="w-4 h-4 text-red-600" /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-700">Trạng thái</span>
                        <Badge className={(notification.read ?? notification.is_read) ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}>
                          {(notification.read ?? notification.is_read) ? "Đã đọc" : "Chưa đọc"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-700">Ngày tạo</span>
                        <span className="text-sm text-gray-700">{formatDate(notification.createdAt || notification.created_at || "")}</span>
                      </div>
                      {notification.account && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700">Người nhận</span>
                          <span className="text-sm text-gray-700">{notification.account?.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#0000001a] rounded-md p-3 space-y-2">
                      <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-sm">
                        Thông tin bổ sung
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-700 text-xs opacity-80">ID:</span>
                          <span className="[font-family:'Inter-Regular',Helvetica] text-gray-700 text-xs opacity-80 truncate ml-2">#{notification.id}</span>
                        </div>
                        {notification.account && (
                          <div className="flex justify-between items-center">
                            <span className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-700 text-xs opacity-80">Email:</span>
                            <span className="[font-family:'Inter-Regular',Helvetica] text-gray-700 text-xs opacity-80 truncate ml-2">{notification.account?.mail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <AddNotificationModal 
        open={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          fetchAll()
        }}
      />
      
      <NotificationDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedNotification(null)
          fetchAll()
        }}
        notification={selectedNotification}
        onDelete={handleDeleteNotification}
        onMarkAsRead={handleMarkAsRead}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal && !!notificationToDelete}
        onClose={() => {
          setShowDeleteModal(false)
          setNotificationToDelete(null)
        }}
        onConfirm={async () => {
          if (notificationToDelete) {
            try {
              await handleDeleteNotification(notificationToDelete.id)
              setShowDeleteModal(false)
              setNotificationToDelete(null)
            } catch (error) {
              console.error("Error deleting notification:", error)
            }
          }
        }}
        title="Xác nhận xóa thông báo"
        itemName={notificationToDelete?.title || 'Không có tiêu đề'}
        itemType="thông báo"
      />
    </div>
  )
}

