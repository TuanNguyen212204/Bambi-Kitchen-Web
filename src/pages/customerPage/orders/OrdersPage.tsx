import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  ClipboardList,
  ListChecks,
  Loader2,
  PackageCheck,
  PackageSearch,
  Loader,
  MapPin,
  Repeat,
  Star,
  Tag,
  Wallet,
} from "lucide-react"
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

interface IngredientInfo {
  id: number
  name: string
  quantity?: number
  unit?: string
  sourceType?: string
}

interface OrderDetailWithIngredients extends ApiOrderDetail {
  ingredients?: IngredientInfo[]
}

interface ApiPayment {
  orderId: number
  accountId?: number
  amount?: number
  paymentMethod?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  transactionId?: string
  note?: string
}

interface PaymentInfo {
  amount?: number
  method?: string
  status?: string
  transactionId?: string
  createdAt?: string
  note?: string
}

interface OrderWithDetails {
  order: ApiOrder
  details: OrderDetailWithIngredients[]
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
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [feedbackRanking, setFeedbackRanking] = useState<number>(5)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [quickOrderOpen, setQuickOrderOpen] = useState(false)
  const [payments, setPayments] = useState<Record<number, PaymentInfo>>({})
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [activeDetailOrderId, setActiveDetailOrderId] = useState<number | null>(null)
  const [orderDetailsState, setOrderDetailsState] = useState<
    Record<
      number,
      {
        loading: boolean
        error?: string
        details?: OrderDetailWithIngredients[]
      }
    >
  >({})

  const ingredientCacheRef = useRef<Map<number, IngredientInfo[]>>(new Map())
  const ingredientUnitCacheRef = useRef<Map<number, string | undefined>>(new Map())

  const ordersWithDetails = useMemo<OrderWithDetails[]>(() => {
    return orders.map((order) => ({
      order,
      details: orderDetailsState[order.id]?.details ?? [],
    }))
  }, [orders, orderDetailsState])

  const formatUnit = (unit?: string) => {
    if (!unit) return ""
    const normalized = unit.toUpperCase()
    const unitMap: Record<string, string> = {
      GRAM: "g",
      KILOGRAM: "kg",
      LITER: "l",
      PCS: "pcs",
      ML: "ml",
    }
    return unitMap[normalized] || unit.toLowerCase()
  }

  const formatIngredientQuantity = (quantity?: number, unit?: string) => {
    if (typeof quantity !== "number") return ""
    const formattedQuantity = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
    }).format(quantity)
    const unitLabel = formatUnit(unit)
    return unitLabel ? `${formattedQuantity} ${unitLabel}` : formattedQuantity
  }

  const formatSourceType = (sourceType?: string) => {
    if (!sourceType) return undefined
    const normalized = sourceType.trim().toUpperCase()
    const map: Record<string, string> = {
      BASE: "Cơ bản",
      ADDON: "Topping",
      REMOVED: "Đã loại",
    }
    return map[normalized] || sourceType
  }

  const formatPaymentMethod = (method?: string) => {
    if (!method) return "Không rõ phương thức"
    const normalized = method.trim().toUpperCase()
    const map: Record<string, string> = {
      VNPAY: "VNPay",
      MOMO: "MoMo",
      CASH: "Tiền mặt",
      COD: "Thanh toán khi nhận",
      BANK_TRANSFER: "Chuyển khoản",
      CREDIT_CARD: "Thẻ tín dụng",
      DEBIT_CARD: "Thẻ ghi nợ",
      ONLINE: "Thanh toán online",
    }
    return map[normalized] || method
  }

  const formatPaymentStatus = (status?: string) => {
    if (!status) return { label: "Không rõ", badge: "bg-gray-100 text-gray-600" }
    const normalized = status.trim().toUpperCase()
    const map: Record<string, { label: string; badge: string }> = {
      SUCCESS: { label: "Thành công", badge: "bg-emerald-100 text-emerald-700" },
      COMPLETED: { label: "Thành công", badge: "bg-emerald-100 text-emerald-700" },
      PAID: { label: "Đã thanh toán", badge: "bg-emerald-100 text-emerald-700" },
      PENDING: { label: "Đang xử lý", badge: "bg-amber-100 text-amber-700" },
      PROCESSING: { label: "Đang xử lý", badge: "bg-amber-100 text-amber-700" },
      FAILED: { label: "Thất bại", badge: "bg-rose-100 text-rose-700" },
      CANCELLED: { label: "Đã hủy", badge: "bg-rose-100 text-rose-700" },
      REFUNDED: { label: "Đã hoàn tiền", badge: "bg-blue-100 text-blue-700" },
    }
    return map[normalized] || { label: status, badge: "bg-gray-100 text-gray-600" }
  }

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

        const sorted = ordersData.sort((a, b) => {
          const dateA = new Date(a.createAt).getTime()
          const dateB = new Date(b.createAt).getTime()
          return dateB - dateA
        })

        setOrders(sorted)

        try {
          const paymentRes = await bambiApi.get<ApiPayment[]>(API_ENDPOINTS.API_PAYMENTS_BY_ACCOUNT(user.id), {
            headers: { "x-silent-error": "1" },
          })
          const paymentList = Array.isArray(paymentRes.data) ? paymentRes.data : []
          const paymentMap = paymentList.reduce<Record<number, PaymentInfo>>((acc, item) => {
            if (!item || typeof item.orderId !== "number") {
              return acc
            }

            const existing = acc[item.orderId]
            const currentTimestamp = item.createdAt ? new Date(item.createdAt).getTime() : 0
            const existingTimestamp = existing?.createdAt ? new Date(existing.createdAt).getTime() : -Infinity

            if (!existing || currentTimestamp >= existingTimestamp) {
              acc[item.orderId] = {
                amount: item.amount,
                method: item.paymentMethod,
                status: item.status,
                transactionId: item.transactionId,
                createdAt: item.createdAt,
                note: item.note,
              }
            }
            return acc
          }, {})
          setPayments(paymentMap)
        } catch {
          setPayments({})
        }
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
          item.id === selectedOrderId
            ? { ...item, ranking: feedbackRanking, comment: feedbackComment.trim() || undefined }
            : item,
        ),
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

  const normalizeRecipeResponse = (raw: unknown): IngredientInfo[] => {
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          const ingredient = (item as { ingredient?: { id?: number; name?: string; unit?: string }; quantity?: number; sourceType?: string }).ingredient
          const quantity = (item as { quantity?: number }).quantity
          if (!ingredient?.id) return null
          return {
            id: ingredient.id,
            name: ingredient.name || `Nguyên liệu #${ingredient.id}`,
            unit: ingredient.unit,
            quantity: typeof quantity === "number" ? quantity : undefined,
            sourceType: (item as { sourceType?: string }).sourceType,
          } satisfies IngredientInfo
        })
        .filter(Boolean) as IngredientInfo[]
    }

    if (
      raw &&
      typeof raw === "object" &&
      "ingredients" in raw &&
      Array.isArray((raw as { ingredients?: unknown[] }).ingredients)
    ) {
      const ingredients = (raw as { ingredients?: Array<{ id?: number; name?: string; neededQuantity?: number; unit?: string; sourceType?: string }> }).ingredients || []
      return ingredients
        .map((ing) => {
          if (!ing?.id) return null
          return {
            id: ing.id,
            name: ing.name || `Nguyên liệu #${ing.id}`,
            quantity: typeof ing.neededQuantity === "number" ? ing.neededQuantity : undefined,
            unit: (ing as { unit?: string }).unit,
            sourceType: ing.sourceType,
          } satisfies IngredientInfo
        })
        .filter(Boolean) as IngredientInfo[]
    }

    return []
  }

  const loadIngredientUnit = async (ingredientId: number): Promise<string | undefined> => {
    const cache = ingredientUnitCacheRef.current
    if (cache.has(ingredientId)) {
      return cache.get(ingredientId)
    }
    try {
      const res = await bambiApi.get<{ unit?: string }>(API_ENDPOINTS.API_INGREDIENT_BY_ID(ingredientId), {
        headers: { "x-silent-error": "1" },
      })
      const unit = res.data?.unit
      cache.set(ingredientId, unit)
      return unit
    } catch {
      cache.set(ingredientId, undefined)
      return undefined
    }
  }

  const loadIngredientsForDish = async (dishId: number): Promise<IngredientInfo[]> => {
    const ingredientCache = ingredientCacheRef.current
    if (ingredientCache.has(dishId)) {
      return ingredientCache.get(dishId) ?? []
    }
    try {
      const res = await bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(dishId), {
        headers: { "x-silent-error": "1" },
      })
      const normalized = normalizeRecipeResponse(res.data)
      const withUnits = await Promise.all(
        normalized.map(async (item) => {
          if (item.unit) return item
          const unit = await loadIngredientUnit(item.id)
          return { ...item, unit }
        }),
      )
      ingredientCache.set(dishId, withUnits)
      return withUnits
    } catch {
      ingredientCache.set(dishId, [])
      return []
    }
  }

  const fetchOrderDetails = async (orderId: number) => {
    setOrderDetailsState((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        loading: true,
        error: undefined,
      },
    }))

    try {
      const detailRes = await bambiApi.get<ApiOrderDetail[]>(API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(orderId), {
        headers: { "x-silent-error": "1" },
      })
      const details = Array.isArray(detailRes.data) ? detailRes.data : []

      const detailsWithIngredients = await Promise.all(
        details.map(async (detail) => {
          if (detail.dish?.id) {
            const ingredients = await loadIngredientsForDish(detail.dish.id)
            return { ...detail, ingredients }
          }
          return { ...detail, ingredients: [] }
        }),
      )

      setOrderDetailsState((prev) => ({
        ...prev,
        [orderId]: {
          loading: false,
          details: detailsWithIngredients,
          error: undefined,
        },
      }))
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error ||
        "Không thể tải chi tiết đơn hàng"
      setOrderDetailsState((prev) => ({
        ...prev,
        [orderId]: {
          loading: false,
          details: [],
          error: message,
        },
      }))
    }
  }

  const handleOpenDetailModal = (orderId: number) => {
    setActiveDetailOrderId(orderId)
    setDetailModalOpen(true)
    if (!orderDetailsState[orderId]?.details && !orderDetailsState[orderId]?.loading) {
      void fetchOrderDetails(orderId)
    }
  }

  const renderContent = () => {
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
        {ordersWithDetails.map(({ order, details }) => {
          const meta = statusMeta[order.status as OrderStatus]
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
          const paymentInfo = payments[order.id]
          const paymentStatusMeta = paymentInfo?.status ? formatPaymentStatus(paymentInfo.status) : null
          const detailState = orderDetailsState[order.id]

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
                        {!!order.note && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {order.note}
                          </span>
                        )}
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
                    <div className="text-right space-y-1">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalPrice || 0)}
                      </p>
                      {paymentInfo && (
                        <div className="text-xs text-gray-600">
                          <div className="inline-flex items-center gap-1 text-gray-600">
                            <Wallet size={14} />
                            <span>{formatPaymentMethod(paymentInfo.method)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {order.note && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-sm text-orange-700">
                    Ghi chú: {order.note}
                  </div>
                )}

                {paymentInfo && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                          <Wallet size={16} className="text-gray-500" />
                          <span>Thông tin thanh toán</span>
                        </div>
                        {paymentStatusMeta && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusMeta.badge}`}>
                            {paymentStatusMeta.label}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                        <span>
                          <span className="font-medium text-gray-700">Phương thức:&nbsp;</span>
                          {formatPaymentMethod(paymentInfo.method)}
                        </span>
                        {typeof paymentInfo.amount === "number" && (
                          <span>
                            <span className="font-medium text-gray-700">Số tiền:&nbsp;</span>
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(paymentInfo.amount)}
                          </span>
                        )}
                        {paymentInfo.transactionId && (
                          <span className="col-span-full">
                            <span className="font-medium text-gray-700">Mã giao dịch:&nbsp;</span>
                            <span className="font-mono">{paymentInfo.transactionId}</span>
                          </span>
                        )}
                        {paymentInfo.createdAt && (
                          <span>
                            <span className="font-medium text-gray-700">Thời gian:&nbsp;</span>
                            {new Date(paymentInfo.createdAt).toLocaleString("vi-VN")}
                          </span>
                        )}
                        {paymentInfo.note && (
                          <span className="col-span-full">
                            <span className="font-medium text-gray-700">Ghi chú:&nbsp;</span>
                            {paymentInfo.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-between items-center border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetailModal(order.id)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Xem chi tiết đơn
                    </Button>
                    {canGiveFeedback(order.status as OrderStatus) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFeedbackModal(order)}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {order.ranking ? "Xem/Sửa đánh giá" : "Đánh giá đơn hàng"}
                      </Button>
                    )}
                  </div>
                  {detailState?.loading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader size={14} className="animate-spin" />
                      Đang tải chi tiết...
                    </div>
                  )}
                </div>

                {/* Feedback section */}
                {canGiveFeedback(order.status as OrderStatus) && order.ranking && (
                  <div className="border-t border-gray-100 pt-4">
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
                      {order.comment && <p className="text-sm text-emerald-700 mt-1">{order.comment}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

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
      {renderContent()}

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

      {/* Order Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          {activeDetailOrderId && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết đơn hàng #{activeDetailOrderId}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {(() => {
                  const order = orders.find((item) => item.id === activeDetailOrderId)
                  const detailState = orderDetailsState[activeDetailOrderId]
                  const paymentInfo = payments[activeDetailOrderId]
                  const paymentStatusMeta = paymentInfo?.status ? formatPaymentStatus(paymentInfo.status) : null

                  if (!order) {
                    return <p className="text-sm text-gray-500">Không tìm thấy thông tin đơn hàng.</p>
                  }

                  return (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">Trạng thái</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta[order.status as OrderStatus]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                            {statusMeta[order.status as OrderStatus]?.label ?? order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">Ngày đặt</span>
                          <span>{new Date(order.createAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">Tổng tiền</span>
                          <span className="font-semibold text-gray-900">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalPrice || 0)}
                          </span>
                        </div>
                        {order.note && (
                          <div>
                            <span className="font-semibold text-gray-800">Ghi chú</span>
                            <p className="text-sm text-gray-600 mt-1">{order.note}</p>
                          </div>
                        )}
                      </div>

                      {paymentInfo && (
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                              <Wallet size={16} />
                              <span>Thanh toán</span>
                            </div>
                            {paymentStatusMeta && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${paymentStatusMeta.badge}`}>
                                {paymentStatusMeta.label}
                              </span>
                            )}
                          </div>
                          <div className="grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                            <span>
                              <span className="font-medium text-gray-700">Phương thức:&nbsp;</span>
                              {formatPaymentMethod(paymentInfo.method)}
                            </span>
                            {typeof paymentInfo.amount === "number" && (
                              <span>
                                <span className="font-medium text-gray-700">Số tiền:&nbsp;</span>
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(paymentInfo.amount)}
                              </span>
                            )}
                            {paymentInfo.transactionId && (
                              <span className="col-span-full">
                                <span className="font-medium text-gray-700">Mã giao dịch:&nbsp;</span>
                                <span className="font-mono">{paymentInfo.transactionId}</span>
                              </span>
                            )}
                            {paymentInfo.createdAt && (
                              <span>
                                <span className="font-medium text-gray-700">Thời gian:&nbsp;</span>
                                {new Date(paymentInfo.createdAt).toLocaleString("vi-VN")}
                              </span>
                            )}
                            {paymentInfo.note && (
                              <span className="col-span-full">
                                <span className="font-medium text-gray-700">Ghi chú:&nbsp;</span>
                                {paymentInfo.note}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Món ăn</h3>
                        </div>
                        {detailState?.loading ? (
                          <div className="flex justify-center items-center py-10 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Đang tải chi tiết đơn hàng...
                          </div>
                        ) : detailState?.error ? (
                          <div className="text-sm text-red-500">{detailState.error}</div>
                        ) : !detailState?.details?.length ? (
                          <div className="text-sm text-gray-500">Không có chi tiết món ăn.</div>
                        ) : (
                          <div className="space-y-3">
                            {detailState.details.map((detail) => {
                              const dishName = detail.dish?.name || "Món ăn không xác định"
                              const dishImage = detail.dish?.imageUrl || detail.dish?.imgUrl
                              const size = detail.size ? `Size ${detail.size}` : undefined
                              const ingredients = detail.ingredients || []

                              return (
                                <div
                                  key={detail.id}
                                  className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm"
                                >
                                  <div className="grid grid-cols-[72px_1fr] gap-4 p-4">
                                    <div className="w-18 h-18 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                      {dishImage ? (
                                        <img src={dishImage} alt={dishName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                          No image
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-gray-900 truncate">{dishName}</p>
                                          <div className="text-xs text-gray-500 space-x-2 mt-1">
                                            {size && <span>{size}</span>}
                                            {typeof detail.totalCalories === "number" && (
                                              <span>{detail.totalCalories} kcal</span>
                                            )}
                                          </div>
                                        </div>
                                        {typeof detail.dish?.price === "number" && (
                                          <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                              detail.dish.price ?? 0,
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {detail.notes && (
                                        <p className="text-xs text-gray-500 mt-1">Ghi chú: {detail.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  {ingredients.length > 0 && (
                                    <div className="border-t border-dashed border-gray-200 bg-slate-50 px-4 py-3">
                                      <p className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        <ListChecks size={12} />
                                        Nguyên liệu
                                      </p>
                                      <ul className="space-y-2">
                                        {ingredients.map((ingredient) => {
                                          const sourceLabel = formatSourceType(ingredient.sourceType)
                                          const quantityLabel = formatIngredientQuantity(ingredient.quantity, ingredient.unit)
                                          return (
                                            <li
                                              key={`${detail.id}-${ingredient.id}-${ingredient.sourceType ?? "base"}`}
                                              className="flex items-center justify-between gap-2 text-xs text-gray-600"
                                            >
                                              <span className="flex items-center gap-2 min-w-0">
                                                <span
                                                  className="truncate font-medium text-gray-700"
                                                  title={ingredient.name}
                                                >
                                                  {ingredient.name}
                                                </span>
                                                {sourceLabel && (
                                                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 border border-gray-200">
                                                    {sourceLabel}
                                                  </span>
                                                )}
                                              </span>
                                              <span className="text-gray-500 tabular-nums">
                                                {quantityLabel || "—"}
                                              </span>
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdersPage
