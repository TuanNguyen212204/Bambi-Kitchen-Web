import { useEffect, useState } from "react"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Calendar, FileText, ChefHat, CheckCircle } from "lucide-react"
import KitchenCounter from "@components/admin/kitchen/KitchenCounter"
import { toast } from "sonner"

type OrderV3 = {
  id: number
  createAt?: string
  totalPrice?: number
  status?: string
  userId?: number
}

type OrderDetailV3 = {
  id: number
  dish?: { id: number; name?: string }
  totalCalories?: number
  notes?: string
  size?: string
}

const FeaturesManagement = () => {
  const [orders, setOrders] = useState<OrderV3[]>([])
  const [loading, setLoading] = useState(false)
  const [paidOrders, setPaidOrders] = useState<OrderV3[]>([])
  const [selectedPaidOrderId, setSelectedPaidOrderId] = useState<number | null>(null)
  const [paidOrderDetails, setPaidOrderDetails] = useState<OrderDetailV3[]>([])
  const [loadingPaidOrderDetails, setLoadingPaidOrderDetails] = useState(false)
  const [allIngredients, setAllIngredients] = useState<Array<{ id: number; name: string; imageUrl?: string; storedQuantity?: number; neededQuantity?: number; unit?: string }>>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [neededIngredientIds, setNeededIngredientIds] = useState<number[]>([])
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<number | null>(null)

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

  // Load tất cả đơn hàng
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      try {
        const res = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS)
        const sorted = (res.data || []).slice().sort((a, b) => {
          const ta = new Date((a as OrderV3).createAt ?? 0).getTime()
          const tb = new Date((b as OrderV3).createAt ?? 0).getTime()
          return tb - ta
        })
        setOrders(sorted)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  // Lọc đơn đã thanh toán (bao gồm cả đang chuẩn bị)
  useEffect(() => {
    const paid = orders.filter(o => {
      const status = String(o.status).toLowerCase()
      return status === "paid" || status === "preparing" || status === "completed"
    })
    setPaidOrders(paid)
  }, [orders])

  // Load tất cả nguyên liệu
  useEffect(() => {
    const loadIngredients = async () => {
      setLoadingIngredients(true)
      try {
        const res = await bambiApi.get<Array<{ id: number; name: string; imgUrl?: string; available?: number; quantity?: number; unit?: string }>>(
          API_ENDPOINTS.API_INGREDIENTS
        )
        const mapped = (res.data || []).map(ing => ({
          id: ing.id,
          name: ing.name,
          imageUrl: ing.imgUrl,
          storedQuantity: ing.available ?? ing.quantity,
          unit: ing.unit
        }))
        setAllIngredients(mapped)
      } catch {
        setAllIngredients([])
      } finally {
        setLoadingIngredients(false)
      }
    }
    loadIngredients()
  }, [])

  const loadPaidOrderDetailsAndRecipe = async (orderId: number) => {
    setLoadingPaidOrderDetails(true)
    try {
      // Load order details
      const detailsRes = await bambiApi.get<OrderDetailV3[]>(
        API_ENDPOINTS.API_ORDER_DETAILS_BY_ORDER(orderId)
      )
      setPaidOrderDetails(detailsRes.data || [])

      // Load recipe cho từng món trong đơn
      const dishIds = (detailsRes.data || [])
        .map(d => d.dish?.id)
        .filter((id): id is number => typeof id === 'number')

      const recipePromises = dishIds.map(dishId =>
        bambiApi.get<{ ingredients?: Array<{ id: number; name: string; storedQuantity?: number; neededQuantity?: number; imageUrl?: string; category?: unknown }> }>(
          API_ENDPOINTS.API_RECIPE_BY_DISH(dishId)
        ).catch(() => null)
      )

      const recipeResults = await Promise.all(recipePromises)
      const neededIds = new Set<number>()
      const ingredientQuantityMap = new Map<number, number>()
      
      recipeResults.forEach(result => {
        if (result?.data?.ingredients) {
          result.data.ingredients.forEach(ing => {
            neededIds.add(ing.id)
            if (typeof ing.neededQuantity === 'number') {
              const current = ingredientQuantityMap.get(ing.id) || 0
              ingredientQuantityMap.set(ing.id, current + ing.neededQuantity)
            }
          })
        }
      })

      setNeededIngredientIds(Array.from(neededIds))

      // Cập nhật allIngredients với neededQuantity
      setAllIngredients(prev => prev.map(ing => {
        const neededQty = ingredientQuantityMap.get(ing.id)
        return {
          ...ing,
          neededQuantity: neededQty
        }
      }))
    } catch {
      setPaidOrderDetails([])
    } finally {
      setLoadingPaidOrderDetails(false)
    }
  }

  const handlePrepareOrder = async (orderId: number) => {
    setUpdatingOrderStatus(orderId)
    try {
      await bambiApi.put(API_ENDPOINTS.API_ORDER_PREPARE(orderId))
      // Reload orders
      const res = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS)
      const sorted = (res.data || []).slice().sort((a, b) => {
        const ta = new Date((a as OrderV3).createAt ?? 0).getTime()
        const tb = new Date((b as OrderV3).createAt ?? 0).getTime()
        return tb - ta
      })
      setOrders(sorted)
      toast.success("Đã chuyển đơn sang trạng thái đang chuẩn bị")
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng")
    } finally {
      setUpdatingOrderStatus(null)
    }
  }

  const handleCompleteOrder = async (orderId: number) => {
    setUpdatingOrderStatus(orderId)
    try {
      await bambiApi.put(API_ENDPOINTS.API_ORDER_COMPLETE(orderId))
      // Reload orders
      const res = await bambiApi.get<OrderV3[]>(API_ENDPOINTS.API_ORDERS)
      const sorted = (res.data || []).slice().sort((a, b) => {
        const ta = new Date((a as OrderV3).createAt ?? 0).getTime()
        const tb = new Date((b as OrderV3).createAt ?? 0).getTime()
        return tb - ta
      })
      setOrders(sorted)
      toast.success("Đã hoàn tất đơn hàng")
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng")
    } finally {
      setUpdatingOrderStatus(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="font-bold text-gray-800 text-[28px] leading-[42px]">Chuẩn bị đơn hàng</h1>
      </div>

      <div className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="flex">
          {/* Left: Danh sách đơn đã thanh toán */}
          <div className="w-1/2 border-r border-gray-200 bg-gray-50 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paidOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
                Không có đơn đã thanh toán
              </div>
            ) : (
              paidOrders.map((o) => {
                const active = selectedPaidOrderId === o.id
                return (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedPaidOrderId(o.id)
                      setNeededIngredientIds([])
                      loadPaidOrderDetailsAndRecipe(o.id)
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
                        String(o.status).toLowerCase() === "completed"
                          ? "bg-green-100 text-green-700"
                          : String(o.status).toLowerCase() === "preparing"
                          ? "bg-blue-100 text-blue-700"
                          : String(o.status).toLowerCase() === "paid"
                          ? "bg-sky-100 text-sky-700"
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

          {/* Right: Quầy bếp */}
          <div className="w-1/2 p-4 overflow-y-auto min-h-0" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {!selectedPaidOrderId ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
                Chọn một đơn hàng để xem nguyên liệu cần thiết
              </div>
            ) : loadingPaidOrderDetails || loadingIngredients ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <KitchenCounter
                  ingredients={allIngredients}
                  neededIngredientIds={neededIngredientIds}
                  orderId={`ORDO${selectedPaidOrderId.toString().padStart(2, '0')}`}
                />
                {paidOrderDetails.length > 0 && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Món trong đơn</h5>
                    <div className="space-y-2">
                      {paidOrderDetails.map((d) => (
                        <div key={d.id} className="p-3 border border-gray-100 rounded-md">
                          <div className="text-sm font-medium text-gray-800">{d.dish?.name || `Món #${d.dish?.id || ''}`}</div>
                          <div className="text-xs text-gray-600">Size: {d.size || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPaidOrderId && (() => {
                  const selectedOrder = paidOrders.find(o => o.id === selectedPaidOrderId)
                  const orderStatus = String(selectedOrder?.status || '').toUpperCase()
                  const isPaid = orderStatus === 'PAID'
                  const isPreparing = orderStatus === 'PREPARING'
                  const isCompleted = orderStatus === 'COMPLETED'
                  const isLoading = updatingOrderStatus === selectedPaidOrderId
                  
                  return (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">Thao tác</h5>
                      <div className="flex gap-2">
                        {isPaid && (
                          <Button
                            onClick={() => handlePrepareOrder(selectedPaidOrderId)}
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ChefHat className="w-4 h-4 mr-2" />
                            {isLoading ? "Đang xử lý..." : "Bắt đầu làm"}
                          </Button>
                        )}
                        {isPreparing && (
                          <Button
                            onClick={() => handleCompleteOrder(selectedPaidOrderId)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isLoading ? "Đang xử lý..." : "Hoàn tất"}
                          </Button>
                        )}
                        {isCompleted && (
                          <div className="text-sm text-gray-600 italic">Đơn hàng đã hoàn tất</div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturesManagement
