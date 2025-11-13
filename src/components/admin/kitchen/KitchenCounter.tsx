import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"

interface Ingredient {
  id: number
  name: string
  imageUrl?: string
  storedQuantity?: number
  neededQuantity?: number
  unit?: string
}

interface KitchenCounterProps {
  ingredients: Ingredient[]
  neededIngredientIds?: number[]
  orderId?: string
}

const GRID_ROWS = 6
const GRID_COLS = 5
const TOTAL_CELLS = GRID_ROWS * GRID_COLS

const formatUnit = (unit?: string): string => {
  if (!unit) return ""
  const unitUpper = unit.toUpperCase()
  // KILOGRAM: ẩn không hiển thị gì
  if (unitUpper === "KILOGRAM") return ""
  // LITER: hiển thị ml
  if (unitUpper === "LITER") return "ml"
  const unitMap: Record<string, string> = {
    GRAM: "g",
    PCS: "phần",
  }
  return unitMap[unitUpper] || unit
}

const convertQuantityForDisplay = (value?: number, unit?: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  if (!unit) return value

  const unitUpper = unit.toUpperCase()
  if (unitUpper === "LITER") {
    return Math.round(value * 1000)
  }
  if (unitUpper === "KILOGRAM") {
    return Math.round(value * 1000)
  }
  return value
}

const formatQuantity = (value?: number, unit?: string): string => {
  const converted = convertQuantityForDisplay(value, unit)
  return Number.isInteger(converted) ? converted.toString() : converted.toString()
}

export default function KitchenCounter({ ingredients, neededIngredientIds = [], orderId }: KitchenCounterProps) {
  // Chỉ lấy các nguyên liệu cần thiết (có trong neededIngredientIds)
  const neededIngredients = useMemo(() => {
    return ingredients.filter(ing => neededIngredientIds.includes(ing.id))
  }, [ingredients, neededIngredientIds])

  // Tạo mảng 30 ô (6x5) - chỉ hiển thị nguyên liệu cần thiết
  const cells = useMemo(() => {
    const cells: Array<{ ingredient: Ingredient | null; isEmpty: boolean; isNeeded: boolean }> = []
    
    // Điền các nguyên liệu cần thiết vào các ô đầu tiên
    neededIngredients.slice(0, TOTAL_CELLS).forEach((ing) => {
      cells.push({
        ingredient: ing,
        isEmpty: false,
        isNeeded: true
      })
    })
    
    // Điền các ô trống
    while (cells.length < TOTAL_CELLS) {
      cells.push({
        ingredient: null,
        isEmpty: true,
        isNeeded: false
      })
    }
    
    return cells
  }, [neededIngredients])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Quầy bếp</h2>
        {orderId && (
          <p className="text-sm text-gray-600">
            Nguyên liệu được highlight cho đơn {orderId}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {cells.map((cell, index) => {
          if (cell.isEmpty) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-xs text-gray-400">Trống</span>
              </div>
            )
          }

          const ing = cell.ingredient!
          const isNeeded = cell.isNeeded
          const hasLowStock = typeof ing.storedQuantity === 'number' && typeof ing.neededQuantity === 'number' && ing.storedQuantity < ing.neededQuantity
          
          // Xác định màu highlight
          const bgColor = isNeeded 
            ? (hasLowStock ? 'bg-orange-50 border-orange-400' : 'bg-green-50 border-green-400')
            : 'bg-gray-50 border-gray-200'
          const borderWidth = isNeeded ? 'border-4' : 'border-2'

          return (
            <div
              key={`ingredient-${ing.id}-${index}`}
              className={`aspect-square ${bgColor} ${borderWidth} rounded-lg p-2 flex flex-col items-center justify-center relative transition-all hover:shadow-md`}
            >
              {hasLowStock && isNeeded && (
                <div className="absolute top-1 right-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
              )}
              
              {ing.imageUrl ? (
                <img
                  src={ing.imageUrl}
                  alt={ing.name}
                  className="w-8 h-8 object-cover rounded mb-1"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-orange-200 rounded mb-1 flex items-center justify-center">
                  <span className="text-xs text-orange-600 font-semibold">
                    {ing.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              
              <span className="text-xs font-medium text-gray-800 text-center line-clamp-2">
                {ing.name}
              </span>
              
              {typeof ing.storedQuantity === 'number' && typeof ing.neededQuantity === 'number' && (
                <span className="text-[10px] text-gray-600 mt-1">
                  {formatQuantity(ing.storedQuantity, ing.unit)}/{formatQuantity(ing.neededQuantity, ing.unit)} {formatUnit(ing.unit)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

