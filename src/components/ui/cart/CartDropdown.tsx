import { useEffect, useRef, useMemo } from "react"
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react"
import { useCartStore } from "@zustand/stores/cart"
import { useNavigate } from "react-router-dom"
import { PATHS } from "@config/path"

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Memoize image URLs để tránh re-render và nhấp nháy
  const itemsWithImageUrl = useMemo(() => {
    return items.map(item => ({
      ...item,
      imageUrl: item.dish.img_url || item.dish.imgUrl || "/placeholder-dish.png"
    }))
  }, [items])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleCheckout = () => {
    onClose()
    // Navigate to order page
    navigate(PATHS.ORDER)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef} 
      className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[600px] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#ea6d27]" />
          <h3 className="font-semibold text-gray-900">Giỏ hàng</h3>
          {items.length > 0 && (
            <span className="bg-[#ea6d27] text-white text-xs px-2 py-1 rounded-full">
              {items.length} món
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          aria-label="Đóng giỏ hàng"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium">Giỏ hàng trống</p>
            <p className="text-xs mt-1">Thêm món ăn vào giỏ hàng để đặt hàng</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {itemsWithImageUrl.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Dish Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                    {item.imageUrl && item.imageUrl !== "/placeholder-dish.png" ? (
                      <img
                        src={item.imageUrl}
                        alt={item.dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        key={item.imageUrl}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          if (target.nextElementSibling) {
                            (target.nextElementSibling as HTMLElement).style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full ${item.imageUrl && item.imageUrl !== "/placeholder-dish.png" ? 'hidden' : 'flex'} items-center justify-center`}>
                      <span className="text-gray-400 text-[10px] text-center px-1">Không có ảnh</span>
                    </div>
                  </div>

                  {/* Dish Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.dish.name}
                    </h4>
                    {item.dish.type === "custom" && (() => {
                      try {
                        const customData = item.notes ? JSON.parse(item.notes) : null
                        if (customData && customData.template) {
                          return (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-orange-600 font-medium">
                                Tô tùy chỉnh
                              </p>
                              <p className="text-xs text-gray-500">
                                Size: {customData.template.size}
                              </p>
                              {customData.recipe && customData.recipe.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {customData.recipe.length} nguyên liệu
                                </p>
                              )}
                            </div>
                          )
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                      return (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          Tô tùy chỉnh
                        </p>
                      )
                    })()}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPrice(item.dish.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                        aria-label="Giảm số lượng"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium text-gray-900 min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                        aria-label="Tăng số lượng"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto w-6 h-6 flex items-center justify-center rounded text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Xóa món"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-sm font-semibold text-[#ea6d27] mt-2">
                      {formatPrice(item.dish.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Tổng cộng:</span>
            <span className="text-lg font-bold text-[#ea6d27]">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Xóa giỏ hàng
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#ea6d27] rounded-md hover:bg-[#d85f1f] transition-colors"
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

