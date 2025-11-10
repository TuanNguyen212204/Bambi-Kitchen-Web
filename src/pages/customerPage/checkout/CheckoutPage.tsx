import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ShoppingCart } from "lucide-react"
import { Button } from "@components/ui/button"
import { useCartStore } from "@/zustand/stores/cart"
import { useAuthStore } from "@zustand/stores/auth"
import { PATHS } from "@config/path"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { CheckoutCartItemsSection } from "@/components/customer/checkout/CheckoutCartItemsSection"
import { CheckoutPaymentSection } from "@/components/customer/checkout/CheckoutPaymentSection"
import { CheckoutOrderNoteSection } from "@/components/customer/checkout/CheckoutOrderNoteSection"

type PaymentMethod = "MOMO" | "VNPAY" | "COD"

interface OrderItemRequest {
  dishId?: number
  basedOnId?: number
  name: string
  quantity: number
  dishTemplate?: { size: "S" | "M" | "L" }
  recipe?: Array<{
    ingredientId: number
    quantity: number
    sourceType: "REMOVED" | "ADDON" | "BASE"
  }>
  note?: string
}

interface MakeOrderRequest {
  accountId: number
  paymentMethod: PaymentMethod
  note?: string
  totalPrice: number
  items: OrderItemRequest[]
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, totalPrice: cartTotalPrice } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD")
  const [note, setNote] = useState("")
  const [discount] = useState(0) // TODO: Implement discount feature
  const [submitting, setSubmitting] = useState(false)

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để thanh toán")
      navigate(PATHS.LOGIN, { state: { from: PATHS.ORDER } })
      return
    }

    if (items.length === 0) {
      toast.info("Giỏ hàng trống")
      navigate(PATHS.MENU)
      return
    }
  }, [isAuthenticated, user, items, navigate])

  // Tính tổng giá
  const subtotal = useMemo(() => {
    return cartTotalPrice
  }, [cartTotalPrice])

  const total = useMemo(() => {
    return subtotal - discount
  }, [subtotal, discount])

  // Parse cart item để tạo order request
  // Phân biệt 3 loại dish:
  // 1. Dish Preset (không tùy chỉnh): có dishId, recipe: []
  // 2. Dish Preset có tùy chỉnh: có basedOnId, recipe có REMOVED/ADDON
  // 3. Custom Dish: không có dishId/basedOnId, recipe chỉ có ADDON
  const parseCartItemToOrderItem = (item: typeof items[0]): OrderItemRequest => {
    let parsedData: {
      basedOnId?: number
      dishTemplate?: { size: "S" | "M" | "L" }
      template?: { size: "S" | "M" | "L" } // Custom Bowl sử dụng template
      recipe?: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }>
      quantity?: number
    } | null = null

    // Parse notes nếu có (chứa JSON data từ PresetDishModal hoặc CustomBowlModal)
    if (item.notes) {
      try {
        parsedData = JSON.parse(item.notes)
      } catch {
        // Nếu không phải JSON, coi như là note thông thường
      }
    }

    const orderItem: OrderItemRequest = {
      name: item.dish.name,
      quantity: item.quantity,
      note: typeof item.notes === "string" && !parsedData ? item.notes : undefined,
    }

    // Nếu có parsedData (từ preset dish customization hoặc custom bowl)
    if (parsedData) {
      // Custom Bowl: có template, không có basedOnId, recipe chỉ có ADDON
      if (parsedData.template && !parsedData.basedOnId) {
        // Custom Dish - không có dishId hoặc basedOnId
        orderItem.dishTemplate = { size: parsedData.template.size }
        if (parsedData.recipe && Array.isArray(parsedData.recipe)) {
          orderItem.recipe = parsedData.recipe // Chỉ có ADDON
        }
      }
      // Preset Dish có tùy chỉnh: có basedOnId, có recipe (REMOVED/ADDON)
      else if (parsedData.basedOnId) {
        orderItem.basedOnId = parsedData.basedOnId
        if (parsedData.dishTemplate) {
          orderItem.dishTemplate = parsedData.dishTemplate
        }
        if (parsedData.recipe && Array.isArray(parsedData.recipe)) {
          orderItem.recipe = parsedData.recipe
        }
      }
      // Trường hợp khác: có dishTemplate nhưng không có basedOnId (có thể là preset nhưng không tùy chỉnh)
      else if (parsedData.dishTemplate) {
        orderItem.dishTemplate = parsedData.dishTemplate
        orderItem.recipe = parsedData.recipe && Array.isArray(parsedData.recipe) ? parsedData.recipe : []
      }
    } else {
      // Nếu không có customization, dùng dishId trực tiếp
      // Dish Preset (không tùy chỉnh)
      orderItem.dishId = item.dish.id
      orderItem.dishTemplate = { size: "M" } // Mặc định size M
      orderItem.recipe = []
    }

    return orderItem
  }

  // Xử lý submit order
  const handleSubmitOrder = async () => {
    if (!user || !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hàng")
      return
    }

    if (items.length === 0) {
      toast.error("Giỏ hàng trống")
      return
    }

    setSubmitting(true)
    try {
      const orderItems: OrderItemRequest[] = items.map(parseCartItemToOrderItem)

      const orderRequest: MakeOrderRequest = {
        accountId: user.id,
        paymentMethod,
        note: note.trim() || undefined,
        totalPrice: total,
        items: orderItems,
      }

      const response = await bambiApi.post<string>(API_ENDPOINTS.API_ORDERS, orderRequest)

      // Nếu response là URL (payment gateway), redirect đến đó
      if (typeof response.data === "string" && response.data.startsWith("http")) {
        window.location.href = response.data
        return
      }

      // Nếu không phải URL (COD hoặc thanh toán thành công ngay), clear cart và redirect đến success page
      useCartStore.getState().clearCart()
      navigate(PATHS.SUCCESS, { 
        state: { 
          title: "Đặt hàng thành công!",
          message: "Đơn hàng của bạn đã được đặt thành công. Chúng tôi sẽ xử lý đơn hàng sớm nhất có thể."
        } 
      })
    } catch (error: unknown) {
      console.error("Error submitting order:", error)
      const errorMessage = 
        (error && typeof error === "object" && "response" in error && 
         error.response && typeof error.response === "object" && "data" in error.response &&
         error.response.data && typeof error.response.data === "object" && "message" in error.response.data &&
         typeof error.response.data.message === "string") 
          ? error.response.data.message
          : (error && typeof error === "object" && "message" in error && typeof error.message === "string")
          ? error.message
          : "Đặt hàng thất bại"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated || !user || items.length === 0) {
    return null
  }

  return (
    <div className="bg-white w-full min-h-screen relative">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Side - My Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Cart Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  My cart
                </h2>
              </div>

              {/* Cart Items */}
              <CheckoutCartItemsSection
                items={items}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onAddMoreItems={() => navigate(PATHS.MENU)}
              />

              {/* Order Summary in Cart */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount:</span>
                    <span className="text-green-600">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>TOTAL:</span>
                  <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(total)}</span>
                </div>
              </div>
            </div>

            {/* Order Note Section */}
            <CheckoutOrderNoteSection
              orderNote={note}
              onOrderNoteChange={setNote}
            />
          </div>

          {/* Right Side - Total Payment & Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-24 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Total payment</h2>

              {/* Payment Method */}
              <CheckoutPaymentSection
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />

              {/* Order Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Discount:</span>
                      <span className="text-green-600">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(total)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitOrder}
                disabled={submitting || items.length === 0}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 text-base font-semibold"
              >
                {submitting ? "Đang xử lý..." : "Send order"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                In the case of group order, the delivery price is paid individually by the balance is automatically deducted on the total amount.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage

