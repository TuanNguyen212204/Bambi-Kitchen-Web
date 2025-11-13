import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, ClipboardList, Loader2, PackageCheck, PackageSearch, Repeat, Star, Tag, Utensils } from "lucide-react"
import { Button } from "@components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog"
import { Textarea } from "@components/ui/textarea"
import QuickOrderModal from "@components/customer/quickorder/QuickOrderModal"
import { PATHS } from "@config/path"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { useAuthStore } from "@zustand/stores/auth"
import { toast } from "sonner"

type OrderStatus = "PENDING" | "PREPARING" | "COMPLETED" | "PAID" | "CANCELLED"

interface ApiOrder {
  id: number
  createAt: string
  totalPrice: number
  status: OrderStatus
  note?: string
  ranking?: number
  comment?: string
}

interface ApiOrderDetail {
  id: number
  dish?: {
    id?: number
    name?: string
    price?: number
    imageUrl?: string
    imgUrl?: string
  }
  notes?: string
  size?: string
  totalCalories?: number
}

interface OrderWithDetails {
  order: ApiOrder
  details: ApiOrderDetail[]
}

const statusMeta: Record<OrderStatus, { label: string; badge: string; border: string; text: string }> = {
  PENDING: {
    label: "Chờ xử lý",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    text: "text-amber-600",
  },
  PREPARING: {
    label: "Đang chuẩn bị",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    text: "text-blue-600",
  },
  PAID: {
    label: "Đã thanh toán",
    badge: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
    text: "text-sky-600",
  },
  COMPLETED: {
    label: "Hoàn tất",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    text: "text-emerald-600",
  },
  CANCELLED: {
    label: "Đã hủy",
    badge: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
    text: "text-rose-600",
  },
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [feedbackRanking, setFeedbackRanking] = useState<number>(5)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [quickOrderOpen, setQuickOrderOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data } = await bambiApi.get<ApiOrder[]>(API_ENDPOINTS.API_ORDERS_BY_USER(user.id), {
          headers: { "x-silent-error": "1" },
        })

        const ordersData = Array.isArray(data) ? data : []

        const ordersWithDetails = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const detailRes = await bambiApi.get<ApiOrderDetail[]>(API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(order.id), {
                headers: { "x-silent-error": "1" },
              })
              const details = Array.isArray(detailRes.data) ? detailRes.data : []
              return { order, details }
            } catch {
              return { order, details: [] }
            }
          }),
        )

        const sorted = ordersWithDetails.sort((a, b) => {
          const dateA = new Date(a.order.createAt).getTime()
          const dateB = new Date(b.order.createAt).getTime()
          return dateB - dateA
        })

        setOrders(sorted)
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
          (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error ||
          "Không thể tải lịch sử đơn hàng"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders().catch(() => {
      setLoading(false)
      setError("Không thể tải lịch sử đơn hàng")
    })
  }, [user?.id])

  const toggleExpanded = (orderId: number) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const openFeedbackModal = (order: ApiOrder) => {
    setSelectedOrderId(order.id)
    setFeedbackRanking(order.ranking || 5)
    setFeedbackComment(order.comment || "")
    setFeedbackModalOpen(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedOrderId) return

    setSubmittingFeedback(true)
    try {
      await bambiApi.put(API_ENDPOINTS.API_ORDER_FEEDBACK_UPDATE, {
        orderId: selectedOrderId,
        ranking: feedbackRanking,
        comment: feedbackComment.trim() || undefined,
      })

      // Cập nhật lại trong state
      setOrders((prev) =>
        prev.map((item) =>
          item.order.id === selectedOrderId
            ? { ...item, order: { ...item.order, ranking: feedbackRanking, comment: feedbackComment.trim() || undefined } }
            : item
        )
      )

      toast.success("Đánh giá đơn hàng thành công!")
      setFeedbackModalOpen(false)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error ||
        "Không thể gửi đánh giá"
      toast.error(message)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const canGiveFeedback = (status: OrderStatus) => {
    // Chỉ cho phép feedback khi đơn đã hoàn thành (COMPLETED)
    return status === "COMPLETED"
  }

  const content = useMemo(() => {
    if (!isAuthenticated || !user) {
      return (
        <div className="max-w-xl mx-auto text-center bg-orange-50 border border-orange-100 rounded-3xl p-12 shadow-sm">
          <PackageSearch className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-700 mb-2">Bạn chưa đăng nhập</h2>
          <p className="text-sm text-orange-600 leading-relaxed mb-6">
            Vui lòng đăng nhập để xem lịch sử đơn hàng và theo dõi trạng thái giao hàng của bạn.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate(PATHS.LOGIN)} className="bg-orange-500 hover:bg-orange-600 text-white">
              Đăng nhập
            </Button>
            <Button variant="outline" onClick={() => navigate(PATHS.REGISTER)} className="border-orange-200 text-orange-600 hover:bg-orange-50">
              Đăng ký
            </Button>
          </div>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
          Đang tải lịch sử đơn hàng...
        </div>
      )
    }

    if (error) {
      return (
        <div className="max-w-xl mx-auto text-center bg-red-50 border border-red-100 rounded-3xl p-12 shadow-sm">
          <ClipboardList className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Không thể tải đơn hàng</h2>
          <p className="text-sm text-red-500 leading-relaxed mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white">
            Thử lại
          </Button>
        </div>
      )
    }

    if (orders.length === 0) {
      return (
        <div className="max-w-xl mx-auto text-center bg-white border border-dashed border-gray-200 rounded-3xl p-12 shadow-sm">
          <PackageCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Bạn chưa có đơn hàng nào</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Khám phá menu và đặt món ngay để trải nghiệm những món ăn tươi ngon từ Bambi Kitchen.
          </p>
          <Button onClick={() => navigate(PATHS.MENU)} className="bg-orange-500 hover:bg-orange-600 text-white">
            Xem menu
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {orders.map(({ order, details }) => {
          const meta = statusMeta[order.status]
          const isExpanded = expanded[order.id] ?? false
          const orderDate = order.createAt
            ? new Date(order.createAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Không xác định"

          const totalItems = details.length

          return (
            <div
              key={order.id}
              className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 ${meta.border}`}
            >
              <div className="p-6 md:p-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Đơn hàng #{order.id}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} />
                          {orderDate}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tag size={14} />
                          {totalItems} món
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalPrice || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {order.note && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-sm text-orange-700">
                    Ghi chú: {order.note}
                  </div>
                )}

                {/* Feedback section */}
                {canGiveFeedback(order.status) && (
                  <div className="border-t border-gray-100 pt-4">
                    {order.ranking ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-emerald-800">Đánh giá của bạn:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= (order.ranking || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        {order.comment && (
                          <p className="text-sm text-emerald-700 mt-1">{order.comment}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFeedbackModal(order)}
                          className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        >
                          Sửa đánh giá
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                        <p className="text-sm text-blue-800 mb-2">Bạn đã nhận được đơn hàng này. Hãy đánh giá trải nghiệm của bạn!</p>
                        <Button
                          size="sm"
                          onClick={() => openFeedbackModal(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Đánh giá đơn hàng
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => toggleExpanded(order.id)}
                    className="w-full flex items-center justify-between text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    <span className="flex items-center gap-2">
                      <Utensils size={16} />
                      {isExpanded ? "Thu gọn món ăn" : "Xem chi tiết món ăn"}
                    </span>
                    <span>{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {details.length === 0 ? (
                        <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-4 py-3">
                          Không có thông tin món ăn cho đơn này.
                        </div>
                      ) : (
                        details.map((detail) => {
                          const dishName = detail.dish?.name || "Món ăn không xác định"
                          const dishImage = detail.dish?.imageUrl || detail.dish?.imgUrl
                          const size = detail.size ? `Size ${detail.size}` : undefined

                          return (
                            <div
                              key={detail.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                  {dishImage ? (
                                    <img src={dishImage} alt={dishName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No image
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{dishName}</p>
                                  <div className="text-xs text-gray-500 space-x-2">
                                    {size && <span>{size}</span>}
                                    {typeof detail.totalCalories === "number" && (
                                      <span>{detail.totalCalories} kcal</span>
                                    )}
                                  </div>
                                  {detail.notes && (
                                    <p className="text-xs text-gray-500 mt-1">Ghi chú: {detail.notes}</p>
                                  )}
                                </div>
                              </div>
                              {typeof detail.dish?.price === "number" && (
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                    detail.dish.price,
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [expanded, isAuthenticated, loading, navigate, orders, user, error])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            Theo dõi trạng thái và chi tiết từng đơn hàng bạn đã đặt tại Bambi Kitchen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setQuickOrderOpen(true)}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
          >
            <Repeat size={16} />
            Đặt lại đơn hàng
          </Button>
          <Button onClick={() => navigate(PATHS.MENU)} variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
            Tiếp tục đặt món
          </Button>
        </div>
      </div>
      {content}

      {/* Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá đơn hàng #{selectedOrderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRanking(star)}
                    className="p-1 hover:opacity-80 transition-opacity"
                    aria-label={`Chọn ${star} sao`}
                  >
                    <Star
                      size={32}
                      className={star <= feedbackRanking ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Chọn {feedbackRanking} sao</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bình luận (tùy chọn)</label>
              <Textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về đơn hàng này..."
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFeedbackModalOpen(false)} disabled={submittingFeedback}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submittingFeedback ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Order Modal */}
      <QuickOrderModal open={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} />
    </div>
  )
}

export default OrdersPage
