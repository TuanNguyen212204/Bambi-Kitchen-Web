import { useEffect, useMemo, useState } from "react"
import KPICards from "@components/admin/dashboard/KPICards"
import RevenueChart, { type RevenuePoint } from "@components/admin/dashboard/RevenueChart"
import OrdersStatusPie from "@components/admin/dashboard/OrdersStatusPie"
import TopDishes from "@components/admin/dashboard/TopDishes"
import LowStockTable from "@components/admin/dashboard/LowStockTable"
import { bambiApi } from "@utils/api-client"
import { API_ENDPOINTS } from "@utils/endpoints"
import { toast } from "sonner"

type OrdersV3 = { id: number; createAt: string; totalPrice: number; status: "PENDING"|"COMPLETED"|"PAID"|"CANCELLED" }
type PaymentV3 = { amount: number; createdAt: string }
type DishV3 = { id: number; name: string; imageUrl?: string; usedQuantity?: number; price?: number }
type LowStockV3 = { id?: number; name?: string; imageUrl?: string; available?: number; unit?: string }

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrdersV3[]>([])
  const [payments, setPayments] = useState<PaymentV3[]>([])
  const [popularDishes, setPopularDishes] = useState<DishV3[]>([])
  const [lowStock, setLowStock] = useState<LowStockV3[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    const fetchData = async () => {
      try {
        const [ordersRes, paymentsRes, dishesRes, lowStockRes] = await Promise.allSettled([
          bambiApi.get<OrdersV3[]>(API_ENDPOINTS.API_ADMIN_ORDERS),
          bambiApi.get<PaymentV3[]>(API_ENDPOINTS.API_ADMIN_TOTAL_REVENUE),
          bambiApi.get<DishV3[]>(API_ENDPOINTS.API_ADMIN_MOST_POPULAR_DISHES),
          bambiApi.get<LowStockV3[]>(API_ENDPOINTS.API_ADMIN_LOW_STOCK),
        ])

        if (!mounted) return

        // Xử lý orders
        if (ordersRes.status === "fulfilled") {
          const data = ordersRes.value.data
          setOrders(Array.isArray(data) ? data : [])
        } else {
          console.error("Error fetching orders:", ordersRes.reason)
          setOrders([])
        }

        // Xử lý payments
        if (paymentsRes.status === "fulfilled") {
          const data = paymentsRes.value.data
          setPayments(Array.isArray(data) ? data : [])
        } else {
          console.error("Error fetching payments:", paymentsRes.reason)
          setPayments([])
        }

        // Xử lý popular dishes
        if (dishesRes.status === "fulfilled") {
          const data = dishesRes.value.data
          setPopularDishes(Array.isArray(data) ? data : [])
        } else {
          console.error("Error fetching popular dishes:", dishesRes.reason)
          setPopularDishes([])
        }

        // Xử lý low stock
        if (lowStockRes.status === "fulfilled") {
          const data = lowStockRes.value.data
          setLowStock(Array.isArray(data) ? data : [])
        } else {
          console.error("Error fetching low stock:", lowStockRes.reason)
          setLowStock([])
        }
      } catch (err) {
        console.error("Dashboard error:", err)
        if (mounted) {
          toast.error("Không thể tải dữ liệu dashboard")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => { mounted = false }
  }, [])

  const revenueSeries: RevenuePoint[] = useMemo(() => {
    // Gom theo ngày (YYYY-MM-DD)
    const map = new Map<string, number>()
    for (const p of payments) {
      const d = (p.createdAt || "").slice(0, 10)
      const prev = map.get(d) || 0
      map.set(d, prev + (typeof p.amount === "number" ? p.amount : 0))
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return sorted.map(([date, amount]) => ({ date, amount }))
  }, [payments])

  const orderStatusData = useMemo(() => {
    const counters: Record<string, number> = { PENDING: 0, PAID: 0, COMPLETED: 0, CANCELLED: 0 }
    for (const o of orders) {
      counters[o.status] = (counters[o.status] || 0) + 1
    }
    return [
      { name: "Đang chờ", value: counters.PENDING || 0 },
      { name: "Đã thanh toán", value: counters.PAID || 0 },
      { name: "Hoàn tất", value: counters.COMPLETED || 0 },
      { name: "Hủy", value: counters.CANCELLED || 0 },
    ]
  }, [orders])

  const kpis = useMemo(() => {
    const totalOrders = orders.length
    const revenueTotal = payments.reduce((s, p) => s + (typeof p.amount === "number" ? p.amount : 0), 0)
    const completed = orders.filter(o => o.status === "COMPLETED").length
    const cancelled = orders.filter(o => o.status === "CANCELLED").length
    return [
      { title: "Tổng đơn", value: totalOrders.toLocaleString("vi-VN"), icon: "🧾" },
      { title: "Doanh thu", value: `${revenueTotal.toLocaleString("vi-VN")} đ`, icon: "💰" },
      { title: "Hoàn tất", value: completed.toLocaleString("vi-VN"), icon: "✅" },
      { title: "Đã hủy", value: cancelled.toLocaleString("vi-VN"), icon: "❌" },
    ]
  }, [orders, payments])



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="font-bold text-gray-800 text-[28px] leading-[42px]">Dashboard</h1>
        <div className="text-sm text-gray-500">Hôm nay: {new Date().toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}</div>
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <KPICards metrics={kpis} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {loading ? (
            <div className="h-72 bg-gray-100 rounded animate-pulse" />
          ) : (
            <RevenueChart data={revenueSeries} />
          )}
        </div>
        <div className="xl:col-span-1">
          {loading ? (
            <div className="h-72 bg-gray-100 rounded animate-pulse" />
          ) : (
            <OrdersStatusPie data={orderStatusData} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          {loading ? <div className="h-64 bg-gray-100 rounded animate-pulse" /> : <TopDishes items={popularDishes} />}
        </div>
        <div className="xl:col-span-2">
          {loading ? <div className="h-64 bg-gray-100 rounded animate-pulse" /> : <LowStockTable items={lowStock} />}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage

