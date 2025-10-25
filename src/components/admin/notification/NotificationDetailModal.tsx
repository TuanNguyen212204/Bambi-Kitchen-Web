import { useState } from "react"
import { Button } from "@components/ui/button"
import { Badge } from "@components/ui/badge"
import { Trash2, Edit3, Mail, User, Calendar, Check } from "lucide-react"
import EditNotificationModal from "./EditNotificationModal"
import ReusableModal from "@components/ui/modal/modal"

interface Props {
  open: boolean
  onClose: () => void
  notification: {
    id: number
    title: string
    message: string
    createdAt: string
    read: boolean
    account?: {
      id: number
      name: string
      mail: string
      role: string
    }
  } | null
  onDelete?: (id: number) => void
  onMarkAsRead?: (id: number) => void
}

export default function NotificationDetailModal({ 
  open, 
  onClose, 
  notification,
  onDelete,
  onMarkAsRead
}: Props) {
  const [showEditModal, setShowEditModal] = useState(false)

  if (!notification) return null

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { text: string; color: string }> = {
      ADMIN: { text: "Quản trị viên", color: "bg-red-100 text-red-600" },
      STAFF: { text: "Nhân viên", color: "bg-blue-100 text-blue-600" },
      USER: { text: "Người dùng", color: "bg-green-100 text-green-600" }
    }
    return roleMap[role] || { text: role, color: "bg-gray-100 text-gray-600" }
  }

  return (
    <>
      <ReusableModal
        open={open}
        onClose={onClose}
        title="Chi tiết thông báo"
        size="2xl"
        contentClassName="max-h-[80vh] overflow-y-auto"
        footer={
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {notification.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={notification.read ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}>
                  {notification.read ? "Đã đọc" : "Chưa đọc"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Nội dung</h4>
            <p className="text-gray-800 whitespace-pre-wrap">{notification.message}</p>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Ngày tạo: {formatDate(notification.createdAt)}</span>
          </div>

          {/* Recipient Info */}
          {notification.account && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Thông tin người nhận</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Tên:</span>
                <span className="font-medium text-gray-900">{notification.account.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{notification.account.mail}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Vai trò:</span>
                <Badge className={getRoleBadge(notification.account.role).color}>
                  {getRoleBadge(notification.account.role).text}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {!notification.read && onMarkAsRead && (
              <Button
                onClick={() => {
                  onMarkAsRead(notification.id)
                  onClose()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Đánh dấu đã đọc
              </Button>
            )}
            <Button
              onClick={() => setShowEditModal(true)}
              variant="outline"
              className="border-gray-300"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
            {onDelete && (
              <Button
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`)) {
                    onDelete(notification.id)
                    onClose()
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </ReusableModal>

      {/* Edit Modal */}
      {showEditModal && (
        <EditNotificationModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            onClose()
          }}
          notification={notification}
        />
      )}
    </>
  )
}

