import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2 } from "lucide-react"
import { useIngredientStore } from "@/zustand/stores/ingredients"
import React from "react"
import type { CartItem } from "@/zustand/types/cart"

interface CheckoutCartItemsSectionProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: number, quantity: number) => void
  onRemoveItem: (itemId: number) => void
  onAddMoreItems: () => void
}

export const CheckoutCartItemsSection: React.FC<CheckoutCartItemsSectionProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onAddMoreItems,
}) => {
  const { items: allIngredients } = useIngredientStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const formatUnit = (unit?: string) => {
    if (!unit) return ""
    const unitMap: Record<string, string> = {
      GRAM: "g",
      KILOGRAM: "kg",
      LITER: "l",
      PCS: "phần",
    }
    return unitMap[unit.toUpperCase()] || unit.toLowerCase()
  }

  const parseItemData = (notes?: string) => {
    if (!notes) return { isCustom: false, recipe: null, note: null, dishTemplate: null, basedOnId: null }
    try {
      const parsed = JSON.parse(notes)
      // Kiểm tra xem có phải là JSON object chứa recipe data không
      if (typeof parsed === "object" && (parsed.recipe || parsed.dishTemplate || parsed.template || parsed.basedOnId)) {
        return {
          isCustom: !!parsed.template && !parsed.basedOnId, // Custom bowl
          isPresetModified: !!parsed.basedOnId, // Preset dish có tùy chỉnh
          recipe: parsed.recipe || null,
          note: null, // Không hiển thị note nếu là JSON data
          dishTemplate: parsed.dishTemplate || parsed.template || null,
          basedOnId: parsed.basedOnId || null,
        }
      }
      // Nếu không phải JSON data, coi như là string note
      return { isCustom: false, recipe: null, note: notes, dishTemplate: null, basedOnId: null }
    } catch {
      // Nếu không parse được, coi như là string note
      return { isCustom: false, recipe: null, note: notes, dishTemplate: null, basedOnId: null }
    }
  }

  // Tạo description cho recipe modifications
  const getRecipeModifications = (recipe: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }> | null) => {
    if (!recipe || recipe.length === 0) return null

    const removals: string[] = []
    const additions: string[] = []

    recipe.forEach((r) => {
      const ingredient = allIngredients.find(ing => ing.id === r.ingredientId)
      if (!ingredient) return

      const unit = formatUnit(ingredient.unit)
      const quantity = Number.isInteger(r.quantity) ? r.quantity : r.quantity.toFixed(1)

      if (r.sourceType === "REMOVED") {
        removals.push(`${ingredient.name} (${quantity}${unit})`)
      } else if (r.sourceType === "ADDON") {
        additions.push(`${ingredient.name} (${quantity}${unit})`)
      }
    })

    const modifications: string[] = []
    if (additions.length > 0) {
      modifications.push(`Thêm: ${additions.join(", ")}`)
    }
    if (removals.length > 0) {
      modifications.push(`Bớt: ${removals.join(", ")}`)
    }

    return modifications.length > 0 ? modifications.join(". ") : null
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const itemPrice = (item.dish.price || 0) * item.quantity
        const hasImage = item.dish.imgUrl || item.dish.img_url
        const itemData = parseItemData(item.notes)
        const recipeModifications = getRecipeModifications(itemData.recipe)
        const size = itemData.dishTemplate?.size

        return (
          <div key={item.id} className="space-y-3">
            {/* Item Card */}
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {hasImage ? (
                  <img
                    src={item.dish.imgUrl || item.dish.img_url}
                    alt={item.dish.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        const placeholder = target.parentElement.querySelector('.placeholder')
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex'
                        }
                      }
                    }}
                  />
                ) : null}
                <div className={`w-full h-full ${hasImage ? 'hidden' : 'flex'} placeholder items-center justify-center`}>
                  <span className="text-gray-400 text-xs text-center px-2">Không có ảnh</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base mb-1">
                  {item.dish.name}
                </h3>
                {item.dish.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {item.dish.description}
                  </p>
                )}
                {/* Recipe Modifications */}
                {recipeModifications && (
                  <p className="text-xs text-gray-500 mb-2 italic">
                    {recipeModifications}
                  </p>
                )}
                {/* Size */}
                {size && (
                  <p className="text-xs text-gray-500 mb-2">
                    Size: {size}
                  </p>
                )}
                {/* Text Note */}
                {itemData.note && (
                  <p className="text-xs text-gray-500 mb-2 italic">
                    {itemData.note}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-300 bg-white rounded">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-normal text-gray-900 text-sm w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatPrice(itemPrice)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Separator */}
            {item.id !== items[items.length - 1]?.id && (
              <Separator className="bg-gray-200" />
            )}
          </div>
        )
      })}

      {/* Add More Items Button */}
      <Button
        variant="outline"
        className="w-full border-2 border-[#fc8a06] bg-white hover:bg-[#fc8a06] hover:text-white transition-colors text-sm"
        onClick={onAddMoreItems}
      >
        + Add more item
      </Button>
    </div>
  )
}

export default CheckoutCartItemsSection

