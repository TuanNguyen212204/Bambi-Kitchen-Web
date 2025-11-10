import React from "react"

type PaymentMethod = "MOMO" | "VNPAY" | "COD"

interface CheckoutPaymentSectionProps {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
}

export const CheckoutPaymentSection: React.FC<CheckoutPaymentSectionProps> = ({
  paymentMethod,
  onPaymentMethodChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Phương thức thanh toán
      </label>
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-gray-200 hover:border-[#fc8a06]">
          <input
            type="radio"
            name="paymentMethod"
            value="MOMO"
            checked={paymentMethod === "MOMO"}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
            className="w-4 h-4 text-[#fc8a06] focus:ring-[#fc8a06]"
          />
          <span className="flex-1 font-medium text-black text-sm">MOMO</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-gray-200 hover:border-[#fc8a06]">
          <input
            type="radio"
            name="paymentMethod"
            value="VNPAY"
            checked={paymentMethod === "VNPAY"}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
            className="w-4 h-4 text-[#fc8a06] focus:ring-[#fc8a06]"
          />
          <span className="flex-1 font-medium text-black text-sm">VNPAY</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-gray-200 hover:border-[#fc8a06]">
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
            className="w-4 h-4 text-[#fc8a06] focus:ring-[#fc8a06]"
          />
          <span className="flex-1 font-medium text-black text-sm">COD (Thanh toán khi nhận hàng)</span>
        </label>
      </div>
    </div>
  )
}

export default CheckoutPaymentSection

