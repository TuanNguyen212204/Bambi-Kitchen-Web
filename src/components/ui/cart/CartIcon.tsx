import { ShoppingCart } from "lucide-react"
import { Badge } from "@components/ui/badge"
import { useCartStore } from "@zustand/stores/cart"

interface CartIconProps {
  className?: string
  onClick?: () => void
}

export default function CartIcon({ className = "", onClick }: CartIconProps) {
  const { totalItems } = useCartStore()

  return (
    <div className="relative">
      <button
        className={`w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50 transition-colors ${className}`}
        onClick={onClick}
        aria-label="Giỏ hàng"
      >
        <ShoppingCart size={18} />
      </button>
      {totalItems > 0 && (
        <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea6d27] text-white p-0 flex items-center justify-center text-xs font-bold">
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      )}
    </div>
  )
}

