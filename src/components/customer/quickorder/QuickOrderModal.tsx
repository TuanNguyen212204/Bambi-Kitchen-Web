import { useEffect, useRef, useState } from "react"
import { X, Clock, Package, Loader2 } from "lucide-react"
import { Button } from "@components/ui/button"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { useAuthStore } from "@zustand/stores/auth"
import { useCartStore } from "@/zustand/stores/cart"
import { toast } from "sonner"
import type { Dish } from "@models/dish/dish"

interface QuickOrderModalProps {
  open: boolean
  onClose: () => void
}

interface OrderForQuickOrder {
  id: number
  createAt: string
  totalPrice: number
  status: string
  details: Array<{
    id: number
    dish?: {
      id?: number
      name?: string
      price?: number
      imageUrl?: string
    }
    notes?: string
    size?: string
  }>
}

export default function QuickOrderModal({ open, onClose }: QuickOrderModalProps) {
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const [orders, setOrders] = useState<OrderForQuickOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const dishCacheRef = useRef<Map<number, Dish>>(new Map())

  useEffect(() => {
    if (open && user?.id) {
      fetchRecentOrders()
    }
  }, [open, user?.id])

  const fetchRecentOrders = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data } = await bambiApi.get<any[]>(API_ENDPOINTS.API_ORDERS_BY_USER(user.id), {
        headers: { "x-silent-error": "1" },
      })

      const ordersData = Array.isArray(data) ? data : []

      // Lấy các đơn hàng đã hoàn thành (COMPLETED hoặc PAID) và có chi tiết
      const ordersWithDetails = await Promise.all(
        ordersData
          .filter((order) => order.status === "COMPLETED" || order.status === "PAID")
          .slice(0, 10) // Chỉ lấy 10 đơn gần nhất
          .map(async (order) => {
            try {
              const detailRes = await bambiApi.get<any[]>(API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(order.id), {
                headers: { "x-silent-error": "1" },
              })
              const details = Array.isArray(detailRes.data) ? detailRes.data : []
              return { ...order, details }
            } catch {
              return { ...order, details: [] }
            }
          })
      )

      // Sắp xếp theo ngày mới nhất và lọc các đơn có chi tiết
      const sorted = ordersWithDetails
        .filter((order) => order.details.length > 0)
        .sort((a, b) => {
          const dateA = new Date(a.createAt).getTime()
          const dateB = new Date(b.createAt).getTime()
          return dateB - dateA
        })

      setOrders(sorted)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const normalizePrice = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/[^\d.-]/g, "")
      if (!cleaned) return 0
      const parsed = Number(cleaned)
      return Number.isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const normalizeDishData = (data: any, fallbackId: number): Dish => {
    const rawType = typeof data?.dishType === "string" ? data.dishType.toLowerCase() : undefined
    const allowedTypes: Dish["type"][] = ["combo", "single", "custom", "quick", "signature"]
    const type = allowedTypes.includes(rawType as Dish["type"]) ? (rawType as Dish["type"]) : "single"

    return {
      id: typeof data?.id === "number" ? data.id : fallbackId,
      name: typeof data?.name === "string" ? data.name : `Món #${fallbackId}`,
      price: normalizePrice(data?.price),
      img_url: data?.imageUrl || data?.imgUrl || "",
      account_id: data?.account?.id ?? data?.accountId ?? 0,
      dish_category_id: data?.dishCategory?.id ?? data?.dishCategoryId ?? 0,
      type,
      description: typeof data?.description === "string" ? data.description : "",
      is_public: typeof data?.public === "boolean" ? data.public : true,
      used: typeof data?.usedQuantity === "number" ? data.usedQuantity : data?.used ?? 0,
    }
  }

  const ensureDishCache = async (dishIds: number[]) => {
    const idsToFetch = dishIds.filter((id) => !dishCacheRef.current.has(id))
    if (!idsToFetch.length) return

    await Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const { data } = await bambiApi.get(
            API_ENDPOINTS.API_DISH_BY_ID(id),
            { headers: { "x-silent-error": "1" } }
          )
          dishCacheRef.current.set(id, normalizeDishData(data, id))
        } catch (error) {
          console.error(`Không thể lấy thông tin món #${id}:`, error)
          // Vẫn lưu placeholder để tránh fetch lại nhiều lần
          if (!dishCacheRef.current.has(id)) {
            dishCacheRef.current.set(id, normalizeDishData({}, id))
          }
        }
      })
    )
  }

  const handleQuickOrder = async (order: OrderForQuickOrder) => {
    if (!order.details || order.details.length === 0) {
      toast.error("Đơn hàng này không có chi tiết")
      return
    }

    setAddingToCart(order.id)
    try {
      const dishIds = order.details
        .map((detail) => detail.dish?.id)
        .filter((id): id is number => typeof id === "number" && id > 0)

      if (dishIds.length) {
        await ensureDishCache(dishIds)
      }

      // Thêm từng món từ đơn hàng vào giỏ hàng
      let addedCount = 0
      for (const detail of order.details) {
        if (detail.dish?.id && detail.dish?.name) {
          const cachedDish = dishCacheRef.current.get(detail.dish.id)
          let price = detail.dish.price !== undefined && detail.dish.price !== null
            ? normalizePrice(detail.dish.price)
            : 0

          if (!price || price <= 0) {
            price = normalizePrice(cachedDish?.price)
          }

          if (!price || price <= 0) {
            const averagePrice = order.totalPrice && order.details.length
              ? normalizePrice(order.totalPrice) / Math.max(order.details.length, 1)
              : 0
            price = Math.max(0, averagePrice)
          }

          if (!Number.isFinite(price) || price < 0) {
            price = 0
          }

          price = Math.round(price)

          const dish: Dish = {
            id: detail.dish.id,
            name: detail.dish.name || cachedDish?.name || `Món #${detail.dish.id}`,
            price,
            img_url: detail.dish.imageUrl || cachedDish?.img_url || "",
            account_id: cachedDish?.account_id ?? 0,
            dish_category_id: cachedDish?.dish_category_id ?? 0,
            type: cachedDish?.type ?? "single",
            description: cachedDish?.description ?? "",
            is_public: cachedDish?.is_public ?? true,
            used: cachedDish?.used ?? 0,
          }

          // Parse notes để lấy thông tin custom bowl nếu có
          const notes = detail.notes || ""
          addItem(dish, 1, notes)
          addedCount++
        }
      }

      if (addedCount > 0) {
        toast.success(`Đã thêm ${addedCount} món vào giỏ hàng!`, {
          description: "Bạn có thể kiểm tra và chỉnh sửa trước khi thanh toán",
        })
        onClose()
      } else {
        toast.error("Không thể thêm món vào giỏ hàng")
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi đặt lại đơn hàng")
      console.error(err)
    } finally {
      setAddingToCart(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 p-4 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đặt lại đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn một đơn hàng trước đó để đặt lại nhanh chóng</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-500">Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-sm text-gray-500">Bạn cần có ít nhất một đơn hàng đã hoàn thành để sử dụng tính năng này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderDate = new Date(order.createAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Đơn hàng #{order.id}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Clock size={12} />
                              <span>{orderDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-13 space-y-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{order.details.length}</span> món •{" "}
                            <span className="font-medium">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalPrice)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.details.slice(0, 3).map((detail) => (
                              <span
                                key={detail.id}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                              >
                                {detail.dish?.name || "Món không xác định"}
                              </span>
                            ))}
                            {order.details.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                +{order.details.length - 3} món khác
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleQuickOrder(order)}
                        disabled={addingToCart === order.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                      >
                        {addingToCart === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Đang thêm...
                          </>
                        ) : (
                          "Đặt lại"
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            Các món sẽ được thêm vào giỏ hàng. Bạn có thể chỉnh sửa trước khi thanh toán.
          </p>
        </div>
      </div>
    </div>
  )
}

