import { useEffect, useMemo, useState } from "react"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { Badge } from "@components/ui/badge"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Calendar, FileText, Search, Plus, Star } from "lucide-react"
import { Button } from "@components/ui/button"
import CreateOrderModal from "@components/admin/order/CreateOrderModal"

type OrderV3 = {
  id: number
  createAt?: string
  totalPrice?: number
  status: string
  userId: number
  staffId?: number
  note?: string
  ranking?: number
  comment?: string
}

type OrderDetailV3 = {
  id: number
  dish?: { id: number; name?: string }
  orders?: { id: number }
  totalCalories?: number
  notes?: string
  size?: string
}

type PaymentV3 = {
  orderId: number
  accountId: number
  amount?: number
  paymentMethod?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  transactionId?: string
  note?: string
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<OrderV3[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [details, setDetails] = useState<OrderDetailV3[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [payment, setPayment] = useState<PaymentV3 | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PAID" | "COMPLETED" | "CANCELLED">("ALL")
  const [openCreate, setOpenCreate] = useState(false)

  const formatCurrency = (amount?: number) =>
    typeof amount === "number"
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
      : "N/A"
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "N/A")
  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      PENDING: "Chờ xử lý",
      PREPARING: "Đang chuẩn bị",
      COMPLETED: "Hoàn thành",
      PAID: "Đã thanh toán",
      CANCELLED: "Đã hủy",
      pending: "Chờ xử lý",
      preparing: "Đang chuẩn bị",
      completed: "Hoàn thành",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
    }
    return m[s] || s
  }

  const filtered = useMemo(() => {
    let data = orders

    if (statusFilter !== "ALL") {
      data = data.filter((o) => String(o.status).toUpperCase() === statusFilter)
    }

    const term = q.trim().toLowerCase()
    if (!term) return data
    return data.filter((o) => {
      const candidates = [
        `#${o.id}`,
        String(o.userId),
        String(o.status),
        o.totalPrice?.toString() || "",
        o.note || "",
        o.comment || "",
      ]
      return candidates.some((v) => v.toLowerCase().includes(term))
    })
  }, [orders, q, statusFilter])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS)
        const sorted = (res.data || []).slice().sort((a, b) => {
          const ta = new Date((a as OrderV3).createAt ?? 0).getTime()
          const tb = new Date((b as OrderV3).createAt ?? 0).getTime()
          return tb - ta
        })
        setOrders(sorted)
        setErrorMsg("")
      } catch {
        setOrders([])
        setErrorMsg("Tải danh sách đơn hàng thất bại. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])


  const loadDetails = async (orderId: number) => {
    setLoadingDetails(true)
    try {
      const res = await bambiApi.get<OrderDetailV3[]>(
        API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(orderId)
      )
      setDetails(res.data || [])
    } finally {
      setLoadingDetails(false)
    }
  }

  const loadPayment = async (orderId: number) => {
    setLoadingPayment(true)
    try {
      // Lấy userId từ order hiện tại
      const order = orders.find(o => o.id === orderId)
      if (order?.userId) {
        const res = await bambiApi.get<PaymentV3[]>(
          API_ENDPOINTS.API_PAYMENTS_BY_ACCOUNT(order.userId)
        )
        const paymentData = (res.data || []).find(p => p.orderId === orderId)
        setPayment(paymentData || null)
      } else {
        setPayment(null)
      }
    } catch {
      setPayment(null)
    } finally {
      setLoadingPayment(false)
    }
  }

  const current = useMemo(() => orders.find((x) => x.id === selectedOrderId) || null, [orders, selectedOrderId])
  const stats = useMemo(() => {
    const total = orders.length
    const paid = orders.filter((o) => String(o.status).toLowerCase() === "paid").length
    const completed = orders.filter((o) => String(o.status).toLowerCase() === "completed").length
    const cancelled = orders.filter((o) => String(o.status).toLowerCase() === "cancelled").length
    return { total, paid, completed, cancelled }
  }, [orders])

  // modal tạo đơn được tách riêng thành component

  return (
    <div className="space-y-4">
      {/* Header stats giống các trang quản trị */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500">Tổng đơn hàng</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500">Đã thanh toán</div>
          <div className="text-2xl font-semibold text-green-600">{stats.paid}</div>
        </div>
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500">Hoàn thành</div>
          <div className="text-2xl font-semibold text-emerald-600">{stats.completed}</div>
        </div>
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500">Đã hủy</div>
          <div className="text-2xl font-semibold text-rose-600">{stats.cancelled}</div>
        </div>
      </div>

      {/* Main section giống các trang quản trị khác */}
      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        {errorMsg && <div className="p-3 text-red-600 text-sm">{errorMsg}</div>}
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">Quản lý đơn hàng</h2>
            <Button onClick={async () => {
              setOpenCreate(true)
            }} className="bg-orange-600 hover:bg-orange-700 h-auto px-3 py-2 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">Tạo đơn hàng</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">Trạng thái</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="bg-white h-auto py-2">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="PAID">Đã thanh toán</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">Tìm kiếm đơn hàng</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã đơn, trạng thái, ghi chú..." className="pl-8 bg-white h-auto py-2" />
              </div>
            </div>
            <div className="space-y-2 flex items-end">
              <Button onClick={() => { /* client search is reactive; this button giữ UX đồng bộ */ }} className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2 text-white">Tìm kiếm</Button>
            </div>
          </div>
        </div>

        <div className="flex">
        {/* Left list */}
        <div className="w-1/2 border-r border-gray-200 bg-gray-50 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
              Không có đơn hàng
            </div>
          ) : (
            filtered.map((o) => {
              const active = selectedOrderId === o.id
              return (
                <div
                  key={o.id}
                  onClick={() => {
                    setSelectedOrderId(o.id)
                    loadDetails(o.id)
                    loadPayment(o.id)
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    active ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Đơn #{o.id}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{new Date(o.createAt || '').toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Ngày: {formatDate(o.createAt)}</span>
                  </div>
                  {typeof o.totalPrice === "number" && (
                    <div className="text-sm font-semibold text-gray-800 mb-2">Tổng tiền: {formatCurrency(o.totalPrice)}</div>
                  )}
                  <Badge
                    className={`text-xs px-2 py-1 ${
                      (String(o.status).toLowerCase() === "completed" || String(o.status).toLowerCase() === "paid")
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {statusLabel(o.status)}
                  </Badge>
                </div>
              )
            })
          )}
        </div>

        {/* Right detail */}
        <div className="w-1/2 p-4 overflow-y-auto min-h-0" style={{ maxHeight: "calc(100vh - 300px)" }}>
          {!selectedOrderId ? (
            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
              Chọn một đơn hàng để xem chi tiết
            </div>
          ) : loadingDetails ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                if (!current) return null
                return (
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">Đơn #{current.id}</h4>
                      <Badge className={`text-xs px-2 py-1 ${
                        (String(current.status).toLowerCase() === "completed" || String(current.status).toLowerCase() === "paid")
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>{statusLabel(current.status)}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">Ngày: {formatDate(current.createAt)}</div>
                    {typeof current.totalPrice === 'number' && (
                      <div className="text-sm font-medium text-gray-800 mb-2">Tổng tiền: {formatCurrency(current.totalPrice)}</div>
                    )}
                    {current.note && <div className="text-sm text-gray-700"><span className="font-medium">Ghi chú:</span> {current.note}</div>}
                    {(current.ranking || current.comment) && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Feedback khách hàng
                        </div>
                        {current.ranking && (
                          <div className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Đánh giá:</span> {current.ranking}/5
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={star <= current.ranking! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {current.comment && (
                          <div className="text-sm text-gray-700 mt-2">
                            <span className="font-medium">Bình luận:</span>
                            <p className="mt-1 text-gray-600 italic">"{current.comment}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-800 mb-3">Món trong đơn</h5>
                {details.length === 0 ? (
                  <div className="text-xs text-gray-500">Không có chi tiết món</div>
                ) : (
                  <div className="space-y-2">
                    {details.map((d) => (
                      <div key={d.id} className="p-3 border border-gray-100 rounded-md">
                        <div className="text-sm font-medium text-gray-800">{d.dish?.name || `Món #${d.dish?.id || ''}`}</div>
                        <div className="text-xs text-gray-600">Size: {d.size || 'N/A'}</div>
                        {d.notes && <div className="text-xs text-gray-700">Ghi chú: {d.notes}</div>}
                        {typeof d.totalCalories === 'number' && (
                          <div className="text-xs text-gray-600">Calories: {d.totalCalories}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin thanh toán */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-800 mb-3">Thông tin thanh toán</h5>
                {loadingPayment ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : payment ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Phương thức thanh toán:</span>
                      <span>{payment.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Trạng thái:</span>
                      <Badge className={payment.status === 'SUCCESS' || payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {payment.status || 'N/A'}
                      </Badge>
                    </div>
                    {typeof payment.amount === 'number' && (
                      <div className="flex justify-between">
                        <span className="font-medium">Số tiền:</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(payment.amount)}</span>
                      </div>
                    )}
                    {payment.transactionId && (
                      <div className="flex justify-between">
                        <span className="font-medium">Mã giao dịch:</span>
                        <span className="font-mono text-xs">{payment.transactionId}</span>
                      </div>
                    )}
                    {payment.createdAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">Thời gian:</span>
                        <span>{new Date(payment.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                    {payment.note && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="font-medium">Ghi chú:</span>
                        <p className="text-xs text-gray-600 mt-1">{payment.note}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Chưa có thông tin thanh toán</div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </section>

      {/* Create Order Modal (componentized) */}
      <CreateOrderModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={async () => {
          setOpenCreate(false)
          setLoading(true)
          try {
            const res = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS)
            const sorted = (res.data || []).slice().sort((a, b) => {
              const ta = new Date((a as OrderV3).createAt ?? 0).getTime()
              const tb = new Date((b as OrderV3).createAt ?? 0).getTime()
              return tb - ta
            })
            setOrders(sorted)
          } finally {
            setLoading(false)
          }
        }}
      />
    </div>
  )
}

export default OrderManagement


