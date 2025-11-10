import React, { useState, useEffect, useMemo, useRef } from "react"
import { X, Plus, Minus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { toast } from "sonner"
import { useIngredientStore } from "@/zustand/stores/ingredients"
import { useCartStore } from "@/zustand/stores/cart"
import { useDishStore } from "@/zustand/stores/dish"
import type { DishItem } from "@/zustand/slices/dish/list.slice"
import type { StoreIngredient } from "@/zustand/types"
import type { Dish } from "@models/dish/dish"
import type { DishTemplateItem } from "@/zustand/slices/dish/template.slice"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

interface PresetDishModalProps {
  open: boolean
  onClose: () => void
  dish: DishItem | null
}

interface IngredientDetail {
  id: number
  name: string
  storedQuantity: number
  neededQuantity: number
  category: {
    id: number
    name: string
  }
  imageUrl?: string
  unit?: string
}

interface DishIngredientsResponse {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  ingredients: IngredientDetail[]
}

interface RecipeModification {
  ingredientId: number
  quantity: number
  sourceType: "REMOVED" | "ADDON"
}

const formatUnit = (unit?: string): string => {
  if (!unit) return ""
  const unitMap: Record<string, string> = {
    GRAM: "g",
    KILOGRAM: "kg",
    LITER: "L",
    PCS: "phần",
  }
  return unitMap[unit.toUpperCase()] || unit
}

export default function PresetDishModal({ open, onClose, dish }: PresetDishModalProps) {
  const { items: allIngredients, fetchAll: fetchIngredients, categories: ingredientCategories, fetchCategories } = useIngredientStore()
  const { templates, fetchTemplates } = useDishStore()
  const { addItem } = useCartStore()
  
  const [dishDetails, setDishDetails] = useState<DishIngredientsResponse | null>(null)
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M")
  const [selectedTemplate, setSelectedTemplate] = useState<DishTemplateItem | null>(null)
  const [recipeModifications, setRecipeModifications] = useState<RecipeModification[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const ingScrollRef = useRef<HTMLDivElement | null>(null)
  const catScrollRef = useRef<HTMLDivElement | null>(null)
  const [showCatLeftArrow, setShowCatLeftArrow] = useState(false)
  const [showCatRightArrow, setShowCatRightArrow] = useState(false)
  const [showIngLeftArrow, setShowIngLeftArrow] = useState(false)
  const [showIngRightArrow, setShowIngRightArrow] = useState(false)
  const [inputValues, setInputValues] = useState<Record<number, string>>({})
  const [removedQuantities, setRemovedQuantities] = useState<Record<number, string>>({})

  // Fetch dish details, ingredients, and templates
  useEffect(() => {
    if (open && dish?.id) {
      setLoading(true)
      let isMounted = true // Flag để tránh update state nếu component đã unmount
      
      // Fetch tất cả data song song
      Promise.all([
        fetchIngredients(),
        fetchCategories(),
        fetchTemplates(),
        bambiApi.get<{ id: number; name: string; description?: string; price: number; imageUrl?: string }>(API_ENDPOINTS.API_DISH_BY_ID(dish.id)),
      ])
        .then((results) => {
          if (!isMounted) return
          
          const dishRes = results[3]
          const dishDataFromApi = dishRes.data
          // Fetch recipe separately sau khi đã có dish data
          return bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(dish.id))
            .then(recipeRes => {
              if (!isMounted) return null
              
              let ingredients: IngredientDetail[] = []
              
              // Parse recipe response theo API v3 docs
              // API trả về IngredientsGetByDishResponse với structure:
              // { id, name, description, price, imageUrl, ingredients: IngredientDetail[] }
              // IngredientDetail: { id, name, storedQuantity, neededQuantity, category, imageUrl }
              // LƯU Ý: IngredientDetail KHÔNG có unit trong schema, cần lấy từ allIngredients
              
              if (Array.isArray(recipeRes.data)) {
                // Trường hợp 1: Response là array of Recipe (mỗi Recipe có ingredient object và quantity)
                const mapped = recipeRes.data.map((r: { 
                  ingredient?: { 
                    id: number
                    name?: string
                    available?: number
                    ingredient_category_id?: number
                    category?: { name?: string }
                    imgUrl?: string
                    imageUrl?: string
                    unit?: string // Có thể có trong ingredient object từ Recipe
                  }
                  quantity?: number
                }) => {
                  if (r.ingredient && typeof r.quantity === 'number') {
                    return {
                      id: r.ingredient.id,
                      name: r.ingredient.name || '',
                      storedQuantity: r.ingredient.available || 0,
                      neededQuantity: r.quantity,
                      category: {
                        id: r.ingredient.ingredient_category_id || 0,
                        name: r.ingredient.category?.name || '',
                      },
                      imageUrl: r.ingredient.imgUrl || r.ingredient.imageUrl || undefined,
                      // Unit có thể có trong ingredient object từ Recipe, nhưng không chắc
                      // Sẽ được merge với allIngredients trong originalIngredients useMemo
                      unit: r.ingredient.unit || undefined,
                    } as IngredientDetail
                  }
                  return null
                })
                ingredients = mapped.filter((ing): ing is IngredientDetail => ing !== null)
              } else if (recipeRes.data && typeof recipeRes.data === 'object' && 'ingredients' in recipeRes.data) {
                // Trường hợp 2: Response là IngredientsGetByDishResponse object
                // Theo API docs: ingredients là array of IngredientDetail
                // IngredientDetail không có unit field, chỉ có: id, name, storedQuantity, neededQuantity, category, imageUrl
                const responseData = recipeRes.data as {
                  id?: number
                  name?: string
                  description?: string
                  price?: number
                  imageUrl?: string
                  ingredients?: Array<{
                    id: number
                    name?: string
                    storedQuantity?: number
                    neededQuantity?: number
                    category?: {
                      id?: number
                      name?: string
                    }
                    imageUrl?: string
                  }>
                }
                
                const ingArray = responseData.ingredients || []
                ingredients = ingArray.map((ing) => ({
                  id: ing.id,
                  name: ing.name || '',
                  storedQuantity: ing.storedQuantity || 0,
                  neededQuantity: ing.neededQuantity || 0,
                  category: {
                    id: ing.category?.id || 0,
                    name: ing.category?.name || '',
                  },
                  imageUrl: ing.imageUrl || undefined,
                  // Unit không có trong IngredientDetail schema, sẽ lấy từ allIngredients
                  unit: undefined,
                })) as IngredientDetail[]
              }
              
              const dishData: DishIngredientsResponse = {
                id: dishDataFromApi.id || 0,
                name: dishDataFromApi.name || '',
                description: dishDataFromApi.description,
                price: dishDataFromApi.price || 0,
                imageUrl: dishDataFromApi.imageUrl,
                ingredients,
              }
              
              return dishData
            })
        })
        .then((dishData) => {
          if (!isMounted || !dishData) return
          setDishDetails(dishData)
        })
        .catch(err => {
          if (!isMounted) return
          console.error("Error fetching dish details:", err)
          toast.error("Không thể tải thông tin món ăn")
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false)
          }
        })
      
      // Cleanup function
      return () => {
        isMounted = false
      }
    }
  }, [open, dish?.id, fetchIngredients, fetchCategories, fetchTemplates])

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedSize("M")
      setSelectedTemplate(null)
      setRecipeModifications([])
      setSelectedCategoryId(null)
      setQuantity(1)
      setInputValues({})
      setRemovedQuantities({})
      setDishDetails(null)
    }
  }, [open])

  // Update selected template when size changes or templates are loaded
  useEffect(() => {
    if (templates.length > 0) {
      const template = templates.find(t => t.size === selectedSize)
      setSelectedTemplate(template || null)
    }
  }, [selectedSize, templates])

  // Get original ingredients from dish, merge with allIngredients to get full unit info
  const originalIngredients = useMemo(() => {
    if (!dishDetails) return []
    return (dishDetails.ingredients || []).map(ing => {
      // Try to get full ingredient info from allIngredients for unit
      const fullIngredient = allIngredients.find(aIng => aIng.id === ing.id)
      return {
        ...ing,
        // Use unit from allIngredients if available, otherwise use from ing
        unit: fullIngredient?.unit || ing.unit,
      }
    })
  }, [dishDetails, allIngredients])

  // Get removed ingredients
  const removedIngredientIds = useMemo(() => {
    return recipeModifications
      .filter(mod => mod.sourceType === "REMOVED")
      .map(mod => mod.ingredientId)
  }, [recipeModifications])

  // Get added ingredients
  const addedIngredients = useMemo(() => {
    return recipeModifications
      .filter(mod => mod.sourceType === "ADDON")
      .map(mod => {
        const ingredient = allIngredients.find(ing => ing.id === mod.ingredientId)
        return ingredient ? { ...ingredient, quantity: mod.quantity } : null
      })
      .filter((ing): ing is StoreIngredient & { quantity: number } => ing !== null)
  }, [recipeModifications, allIngredients])

  // Get available ingredients for adding (excluding original ingredients)
  // Group by category priority to check limits
  const availableIngredients = useMemo(() => {
    const originalIds = originalIngredients.map(ing => ing.id)
    return allIngredients.filter(ing => 
      ing.active !== false &&
      (ing.available ?? 0) > 0 &&
      !originalIds.includes(ing.id)
    )
  }, [allIngredients, originalIngredients])

  // Get added ingredients count by category priority
  const getAddedCountByPriority = (priority: number) => {
    return addedIngredients.filter(added => {
      const ingredient = allIngredients.find(ing => ing.id === added.id)
      const category = ingredientCategories.find(cat => cat.id === ingredient?.categoryId)
      return category?.priority === priority
    }).length
  }

  // Check if can add more ingredients for a category priority
  const canAddMoreForPriority = (priority: number) => {
    if (!selectedTemplate) return true
    
    const count = getAddedCountByPriority(priority)
    // priority 1 = carb, 2 = protein, 3 = vegetable
    if (priority === 1) {
      return !selectedTemplate.max_Carb || count < selectedTemplate.max_Carb
    }
    if (priority === 2) {
      return !selectedTemplate.max_Protein || count < selectedTemplate.max_Protein
    }
    if (priority === 3) {
      return !selectedTemplate.max_Vegetable || count < selectedTemplate.max_Vegetable
    }
    return true // Other priorities (side dishes) không có limit
  }

  // Filter available ingredients that are not already added
  const availableIngredientsNotAdded = useMemo(() => {
    return availableIngredients.filter(ing =>
      !recipeModifications.some(mod => mod.ingredientId === ing.id && mod.sourceType === "ADDON")
    )
  }, [availableIngredients, recipeModifications])

  // Get ingredient categories for available ingredients
  const availableCategories = useMemo(() => {
    const categoryIds = new Set(availableIngredientsNotAdded.map(ing => ing.categoryId).filter(Boolean))
    return ingredientCategories.filter(cat => categoryIds.has(cat.id))
  }, [availableIngredientsNotAdded, ingredientCategories])

  // Get ingredients for selected category
  const ingredientsForCategory = useMemo(() => {
    if (!selectedCategoryId) return availableIngredientsNotAdded
    return availableIngredientsNotAdded.filter(ing => ing.categoryId === selectedCategoryId)
  }, [availableIngredientsNotAdded, selectedCategoryId])

  // Auto-select first category
  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(availableCategories[0].id)
    }
  }, [availableCategories, selectedCategoryId])

  // Handle remove ingredient quantity change - giống CustomBowlModal
  const handleRemovedQuantityChange = (ingredientId: number, value: string) => {
    // Lưu giá trị input (có thể rỗng) vào state tạm thời
    setRemovedQuantities(prev => ({ ...prev, [ingredientId]: value }))
    
    // Nếu rỗng, chỉ cập nhật input value, không cập nhật modification
    if (value === "" || value === "-" || value === ".") {
      return
    }
    
    const numValue = parseFloat(value)
    const originalIng = originalIngredients.find(ing => ing.id === ingredientId)
    if (!originalIng) return

    // Nếu không phải số hợp lệ, giữ nguyên input value
    if (isNaN(numValue)) {
      return
    }

    // Giới hạn số lượng bỏ bớt không vượt quá số lượng gốc
    if (numValue < 0) {
      setRemovedQuantities(prev => ({ ...prev, [ingredientId]: "0" }))
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "REMOVED")))
      return
    }
    
    if (numValue > originalIng.neededQuantity) {
      // Nếu vượt quá, set về giá trị tối đa
      const finalQuantity = originalIng.neededQuantity
      setRemovedQuantities(prev => ({ ...prev, [ingredientId]: finalQuantity.toString() }))
      setRecipeModifications(prev => {
        const filtered = prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "REMOVED"))
        return [
          ...filtered.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "ADDON")),
          {
            ingredientId,
            quantity: finalQuantity,
            sourceType: "REMOVED" as const,
          }
        ]
      })
      return
    }

    // Cập nhật modification với giá trị hợp lệ
    if (numValue > 0 && numValue <= originalIng.neededQuantity) {
      setRecipeModifications(prev => {
        const filtered = prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "REMOVED"))
        return [
          ...filtered.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "ADDON")),
          {
            ingredientId,
            quantity: numValue,
            sourceType: "REMOVED" as const,
          }
        ]
      })
    } else if (numValue === 0) {
      // Nếu = 0, xóa modification
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "REMOVED")))
      setRemovedQuantities(prev => {
        const next = { ...prev }
        delete next[ingredientId]
        return next
      })
    }
  }

  // Handle add ingredient with category limit check
  const handleAddIngredient = (ingredient: StoreIngredient) => {
    const existing = recipeModifications.find(mod => mod.ingredientId === ingredient.id && mod.sourceType === "ADDON")
    if (existing) {
      // Remove the add modification
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredient.id && mod.sourceType === "ADDON")))
      setInputValues(prev => {
        const next = { ...prev }
        delete next[ingredient.id]
        return next
      })
    } else {
      // Check category limit before adding
      const category = ingredientCategories.find(cat => cat.id === ingredient.categoryId)
      const priority = category?.priority || 0
      
      if (priority > 0 && priority <= 3) {
        // Check if can add more for this priority (carb, protein, vegetable)
        if (!canAddMoreForPriority(priority)) {
          let limitName = ""
          if (priority === 1) limitName = `Tinh Bột (tối đa ${selectedTemplate?.max_Carb || 0})`
          else if (priority === 2) limitName = `Protein (tối đa ${selectedTemplate?.max_Protein || 0})`
          else if (priority === 3) limitName = `Rau (tối đa ${selectedTemplate?.max_Vegetable || 0})`
          
          toast.warning(`Bạn chỉ có thể thêm tối đa ${limitName} nguyên liệu`)
          return
        }
      }
      
      // Add the ingredient with default quantity
      const defaultQuantity = ingredient.unit?.toUpperCase() === "PCS" ? 1 : 100
      setRecipeModifications(prev => [
        ...prev.filter(mod => !(mod.ingredientId === ingredient.id && mod.sourceType === "REMOVED")),
        {
          ingredientId: ingredient.id,
          quantity: defaultQuantity,
          sourceType: "ADDON" as const,
        }
      ])
      setInputValues(prev => ({ ...prev, [ingredient.id]: defaultQuantity.toString() }))
    }
  }

  // Handle quantity change for added ingredient
  const handleQuantityChange = (ingredientId: number, value: string) => {
    setInputValues(prev => ({ ...prev, [ingredientId]: value }))
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setRecipeModifications(prev => prev.map(mod => 
        mod.ingredientId === ingredientId && mod.sourceType === "ADDON"
          ? { ...mod, quantity: numValue }
          : mod
      ))
    }
  }

  // Calculate total price based on size ratio and added ingredients
  const totalPrice = useMemo(() => {
    if (!dishDetails) return 0
    
    // Base price with size ratio
    const priceRatio = selectedTemplate?.priceRatio || 1
    let basePrice = dishDetails.price * priceRatio
    
    // Add prices for added ingredients
    addedIngredients.forEach(added => {
      const ingredient = allIngredients.find(ing => ing.id === added.id)
      if (ingredient && ingredient.pricePerUnit) {
        basePrice += ingredient.pricePerUnit * added.quantity
      }
    })
    
    // Note: Removed ingredients don't reduce price in preset dishes
    // (they're already included in the base price)
    
    return Math.round(basePrice * quantity)
  }, [dishDetails, selectedTemplate, addedIngredients, allIngredients, quantity])

  // Handle add to cart
  const handleAddToCart = () => {
    if (!dishDetails || !dish) return
    
    // Generate name với thông tin chỉnh sửa
    let dishName = dishDetails.name
    if (recipeModifications.length > 0) {
      const removals = recipeModifications.filter(mod => mod.sourceType === "REMOVED")
      const additions = recipeModifications.filter(mod => mod.sourceType === "ADDON")
      
      const removalNames = removals.map(mod => {
        const ing = originalIngredients.find(ing => ing.id === mod.ingredientId)
        return ing ? ing.name : ""
      }).filter(Boolean)
      
      const additionNames = additions.map(mod => {
        const ing = allIngredients.find(ing => ing.id === mod.ingredientId)
        return ing ? ing.name : ""
      }).filter(Boolean)
      
      if (removalNames.length > 0 || additionNames.length > 0) {
        const modifications: string[] = []
        if (removalNames.length > 0) {
          modifications.push(`không ${removalNames.join(", ")}`)
        }
        if (additionNames.length > 0) {
          modifications.push(`thêm ${additionNames.join(", ")}`)
        }
        dishName = `${dishDetails.name} ${modifications.join(" ")}`
      }
    }
    
    // Create modification data theo API structure
    const modificationData = {
      basedOnId: dish.id,
      name: dishName,
      quantity: quantity,
      dishTemplate: { size: selectedSize },
      recipe: recipeModifications.map(mod => ({
        ingredientId: mod.ingredientId,
        quantity: Math.round(mod.quantity), // API expects integer
        sourceType: mod.sourceType,
      })),
    }
    
    // Calculate price with size ratio for cart
    const priceRatio = selectedTemplate?.priceRatio || 1
    const basePrice = dishDetails.price * priceRatio
    let finalPrice = basePrice
    addedIngredients.forEach(added => {
      const ingredient = allIngredients.find(ing => ing.id === added.id)
      if (ingredient && ingredient.pricePerUnit) {
        finalPrice += ingredient.pricePerUnit * added.quantity
      }
    })
    
    // Convert DishItem to Dish format for cart
    const dishForCart: Dish = {
      id: dish.id,
      name: dishName,
      price: Math.round(finalPrice), // Price per unit with modifications
      img_url: dishDetails.imageUrl || dish.imageUrl || "",
      account_id: 0,
      dish_category_id: dish.categoryId || 0,
      type: "single",
      description: dishDetails.description || "",
      is_public: dish.public !== false,
      used: dish.usedQuantity || 0,
    }
    
    // Add to cart with modification data in notes
    addItem(dishForCart, quantity, JSON.stringify(modificationData))
    
    toast.success("Đã thêm vào giỏ hàng", {
      description: `${dishName} (Size: ${selectedSize}, SL: ${quantity})${recipeModifications.length > 0 ? ` với ${recipeModifications.length} thay đổi` : ""}`,
    })
    
    onClose()
  }

  // Check scroll position
  const checkScrollPosition = (ref: React.RefObject<HTMLDivElement>, setLeft: (show: boolean) => void, setRight: (show: boolean) => void) => {
    if (!ref.current) return
    const { scrollLeft, scrollWidth, clientWidth } = ref.current
    setLeft(scrollLeft > 10)
    setRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Handle scroll
  const handleCategoryScroll = () => {
    checkScrollPosition(catScrollRef, setShowCatLeftArrow, setShowCatRightArrow)
  }

  const handleIngredientScroll = () => {
    checkScrollPosition(ingScrollRef, setShowIngLeftArrow, setShowIngRightArrow)
  }

  // Update scroll button states
  useEffect(() => {
    const updateScrollStates = () => {
      if (catScrollRef.current) {
        handleCategoryScroll()
      }
      if (ingScrollRef.current) {
        handleIngredientScroll()
      }
    }
    const timer = setTimeout(updateScrollStates, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientsForCategory, selectedCategoryId, availableCategories])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b bg-white sticky top-0 z-10 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{dishDetails?.name || dish?.name || "Món ăn"}</h2>
            {dishDetails?.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">{dishDetails.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12">Đang tải...</div>
          ) : !dishDetails ? (
            <div className="text-center py-12 text-gray-500">Không thể tải thông tin món ăn</div>
          ) : (
            <div className="space-y-5">
              {/* Size Selection - Card Style với giá và thông tin template */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Chọn kích thước</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["S", "M", "L"] as const).map((size) => {
                    const template = templates.find(t => t.size === size)
                    const priceRatio = template?.priceRatio || 1
                    const sizePrice = dishDetails ? Math.round(dishDetails.price * priceRatio) : 0
                    const isSelected = selectedSize === size
                    
                    return (
                      <div
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          {/* Bowl icon giống CustomBowlModal */}
                          <div className="w-20 h-20 mb-3 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 rounded-full">
                            <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <ellipse cx="12" cy="17" rx="9" ry="4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M3 17c0-2.5 4.03-4.5 9-4.5s9 2 9 4.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M3 13c0-2 4.03-3.5 9-3.5s9 1.5 9 3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{template?.name || `Size ${size}`}</h3>
                          {/* Hiển thị thông tin giới hạn nếu có */}
                          {template && (
                            <div className="space-y-1 text-xs text-gray-600 mb-2">
                              {template.max_Carb !== undefined && (
                                <p>Tinh Bột: tối đa {template.max_Carb} phần</p>
                              )}
                              {template.max_Protein !== undefined && (
                                <p>Protein: tối đa {template.max_Protein} phần</p>
                              )}
                              {template.max_Vegetable !== undefined && (
                                <p>Rau: tối đa {template.max_Vegetable} phần</p>
                              )}
                            </div>
                          )}
                          {/* Hiển thị giá */}
                          <p className="text-lg font-bold text-orange-600 mt-2">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(sizePrice)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Số lượng</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-10 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Original Ingredients - Giống CustomBowlModal style */}
              {originalIngredients.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Nguyên liệu có sẵn</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {originalIngredients.map((ing) => {
                      const isRemoved = removedIngredientIds.includes(ing.id)
                      const removedMod = recipeModifications.find(mod => mod.ingredientId === ing.id && mod.sourceType === "REMOVED")
                      const removedQty = removedMod?.quantity || 0
                      const remainingQty = Math.max(0, ing.neededQuantity - removedQty)
                      const currentInputValue = removedQuantities[ing.id] !== undefined 
                        ? removedQuantities[ing.id] 
                        : (isRemoved ? removedQty.toString() : "")
                      
                      return (
                        <div
                          key={ing.id}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isRemoved
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {ing.imageUrl ? (
                            <img
                              src={ing.imageUrl}
                              alt={ing.name}
                              className="w-full h-24 object-cover rounded-lg mb-2"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                img.style.display = 'none'
                                const parent = img.parentElement
                                if (parent && !parent.querySelector('.no-image-placeholder')) {
                                  const placeholder = document.createElement('div')
                                  placeholder.className = 'no-image-placeholder w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center'
                                  placeholder.innerHTML = '<span class="text-gray-400 text-xs">Không có ảnh</span>'
                                  parent.insertBefore(placeholder, img)
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Không có ảnh</span>
                            </div>
                          )}
                          <h4 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{ing.name}</h4>
                          
                          {/* Hiển thị khẩu phần với đơn vị - luôn hiển thị */}
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            Khẩu phần: {ing.neededQuantity} {ing.unit ? formatUnit(ing.unit) : ""}
                          </p>
                          
                          {/* Input để bỏ bớt - giống CustomBowlModal */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">Bỏ bớt:</label>
                              <Input
                                type="number"
                                step={ing.unit?.toUpperCase() === "PCS" ? "1" : "0.1"}
                                min={0}
                                max={ing.neededQuantity}
                                value={currentInputValue}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || val === "-" || val === ".") {
                                    setRemovedQuantities(prev => ({ ...prev, [ing.id]: val }))
                                    return
                                  }
                                  handleRemovedQuantityChange(ing.id, val)
                                }}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (isNaN(val) || val <= 0) {
                                    // Nếu rỗng hoặc 0, xóa modification
                                    setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ing.id && mod.sourceType === "REMOVED")))
                                    setRemovedQuantities(prev => {
                                      const next = { ...prev }
                                      delete next[ing.id]
                                      return next
                                    })
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                  e.stopPropagation()
                                  e.target.select()
                                }}
                                className="h-7 text-xs text-center p-1 flex-1"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-600 flex-shrink-0">
                                {ing.unit ? formatUnit(ing.unit) : ""}
                              </span>
                            </div>
                            
                            {/* Hiển thị đã bỏ và còn lại */}
                            {isRemoved && removedQty > 0 && (
                              <div className="space-y-0.5 pt-1 border-t border-gray-200">
                                <p className="text-xs text-red-600 font-medium">
                                  Đã bỏ: {removedQty} {ing.unit ? formatUnit(ing.unit) : ""}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Còn lại: {remainingQty} {ing.unit ? formatUnit(ing.unit) : ""}
                                </p>
                              </div>
                            )}
                            {!isRemoved && removedQty === 0 && (
                              <p className="text-xs text-gray-500">
                                Còn nguyên: {ing.neededQuantity} {ing.unit ? formatUnit(ing.unit) : ""}
                              </p>
                            )}
                            {!isRemoved && removedQty === 0 && currentInputValue === "" && (
                              <p className="text-xs text-gray-400 italic">
                                Nhập số lượng để bỏ bớt
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add Ingredients */}
              {availableIngredientsNotAdded.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Thêm nguyên liệu (Tính phí)</h3>
                    {selectedTemplate && (
                      <div className="text-xs text-gray-600 space-x-3">
                        {selectedTemplate.max_Carb !== undefined && (
                          <span>
                            Tinh Bột: {getAddedCountByPriority(1)}/{selectedTemplate.max_Carb}
                          </span>
                        )}
                        {selectedTemplate.max_Protein !== undefined && (
                          <span>
                            Protein: {getAddedCountByPriority(2)}/{selectedTemplate.max_Protein}
                          </span>
                        )}
                        {selectedTemplate.max_Vegetable !== undefined && (
                          <span>
                            Rau: {getAddedCountByPriority(3)}/{selectedTemplate.max_Vegetable}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Category selector */}
                  {availableCategories.length > 1 && (
                    <div className="relative mb-4">
                      <div className="flex items-center gap-2">
                        {showCatLeftArrow && (
                          <button
                            onClick={() => {
                              catScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
                              setTimeout(handleCategoryScroll, 300)
                            }}
                            className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft size={20} />
                          </button>
                        )}
                        <div
                          ref={catScrollRef}
                          onScroll={handleCategoryScroll}
                          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1"
                        >
                          {availableCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategoryId(category.id)}
                              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                                selectedCategoryId === category.id
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                        {showCatRightArrow && (
                          <button
                            onClick={() => {
                              catScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
                              setTimeout(handleCategoryScroll, 300)
                            }}
                            className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50"
                            aria-label="Scroll right"
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ingredients grid - Card style like CustomBowlModal */}
                  {ingredientsForCategory.length > 0 ? (
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        {showIngLeftArrow && (
                          <button
                            onClick={() => {
                              ingScrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })
                              setTimeout(handleIngredientScroll, 300)
                            }}
                            className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft size={20} className="text-gray-700" />
                          </button>
                        )}
                        <div
                          ref={ingScrollRef}
                          onScroll={handleIngredientScroll}
                          className="overflow-x-auto pb-4 scrollbar-hide flex-1"
                        >
                          <div className="flex gap-4" style={{ width: 'max-content' }}>
                            {ingredientsForCategory.map((ingredient) => {
                              const isAdded = addedIngredients.some(added => added.id === ingredient.id)
                              const addedIng = addedIngredients.find(added => added.id === ingredient.id)
                              
                              // Check if can add this ingredient based on category limit
                              const ingredientCategory = ingredientCategories.find(cat => cat.id === ingredient.categoryId)
                              const ingredientPriority = ingredientCategory?.priority || 0
                              const canAdd = ingredientPriority === 0 || ingredientPriority > 3 || canAddMoreForPriority(ingredientPriority) || isAdded
                              
                              return (
                                <div
                                  key={ingredient.id}
                                  className={`flex-shrink-0 w-48 p-4 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                                    isAdded
                                      ? "border-orange-500 bg-orange-50"
                                      : canAdd
                                      ? "border-gray-200 hover:border-orange-300"
                                      : "border-gray-200 opacity-50 cursor-not-allowed"
                                  }`}
                                  onClick={() => {
                                    if (!isAdded && canAdd) {
                                      handleAddIngredient(ingredient)
                                    } else if (!canAdd && !isAdded) {
                                      let limitMsg = ""
                                      if (ingredientPriority === 1) limitMsg = `Tinh Bột (tối đa ${selectedTemplate?.max_Carb || 0})`
                                      else if (ingredientPriority === 2) limitMsg = `Protein (tối đa ${selectedTemplate?.max_Protein || 0})`
                                      else if (ingredientPriority === 3) limitMsg = `Rau (tối đa ${selectedTemplate?.max_Vegetable || 0})`
                                      toast.warning(`Đã đạt giới hạn tối đa cho ${limitMsg}`)
                                    }
                                  }}
                                >
                                  {ingredient.imgUrl ? (
                                    <img
                                      src={ingredient.imgUrl}
                                      alt={ingredient.name}
                                      className="w-full h-32 object-cover rounded-lg mb-3"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement
                                        img.style.display = 'none'
                                        const parent = img.parentElement
                                        if (parent && !parent.querySelector('.no-image-placeholder')) {
                                          const placeholder = document.createElement('div')
                                          placeholder.className = 'no-image-placeholder w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center'
                                          placeholder.innerHTML = '<span class="text-gray-400 text-xs">Không có ảnh</span>'
                                          parent.insertBefore(placeholder, img)
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">Không có ảnh</span>
                                    </div>
                                  )}
                                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">{ingredient.name}</h4>
                                  {ingredient.pricePerUnit !== undefined && (
                                    <p className="text-xs text-gray-600 mb-1">
                                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ingredient.pricePerUnit)}/{formatUnit(ingredient.unit)}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-gray-500 mb-2">
                                    Khả dụng: {ingredient.available ?? 0}{ingredient.unit ? ` ${formatUnit(ingredient.unit)}` : ""}
                                  </p>
                                  {isAdded && addedIng && (
                                    <div className="flex items-center gap-1.5 mt-2 w-full">
                                      <label className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">Số lượng:</label>
                                      <Input
                                        type="number"
                                        step={ingredient.unit?.toUpperCase() === "PCS" ? "1" : "0.1"}
                                        min={0.1}
                                        max={ingredient.available ?? Infinity}
                                        value={inputValues[ingredient.id] !== undefined 
                                          ? inputValues[ingredient.id] 
                                          : addedIng.quantity.toString()}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleQuantityChange(ingredient.id, e.target.value)
                                        }}
                                        onBlur={(e) => {
                                          e.stopPropagation()
                                          const val = parseFloat(e.target.value)
                                          if (isNaN(val) || val <= 0) {
                                            handleAddIngredient(ingredient)
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => {
                                          e.stopPropagation()
                                          e.target.select()
                                        }}
                                        className="w-14 h-7 text-xs text-center p-1 flex-shrink-0"
                                        placeholder="Nhập số"
                                      />
                                      <span className="text-xs text-gray-600 flex-shrink-0">{formatUnit(ingredient.unit)}</span>
                                      <div className="text-orange-500 flex-shrink-0 ml-auto pr-1">
                                        <Check size={14} />
                                      </div>
                                    </div>
                                  )}
                                  {!isAdded && (
                                    <div className="w-full mt-2 px-3 py-1 text-xs font-medium text-orange-600 border border-orange-500 rounded-lg text-center">
                                      Nhấn để thêm
                                    </div>
                                  )}
                                  {isAdded && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddIngredient(ingredient)
                                      }}
                                      className="w-full mt-2 text-xs border-red-500 text-red-500 hover:bg-red-50"
                                    >
                                      Bỏ
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {showIngRightArrow && (
                          <button
                            onClick={() => {
                              ingScrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })
                              setTimeout(handleIngredientScroll, 300)
                            }}
                            className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                            aria-label="Scroll right"
                          >
                            <ChevronRight size={20} className="text-gray-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Không có nguyên liệu nào trong danh mục này</p>
                  )}
                </div>
              )}

              {/* Summary with detailed modifications */}
              <div className="border-t pt-4 mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-bold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}
                  </span>
                </div>
                
                {/* Hiển thị chi tiết đã thêm/bớt */}
                {(removedIngredientIds.length > 0 || addedIngredients.length > 0) && (
                  <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-1">Chi tiết chỉnh sửa:</p>
                    
                    {/* Hiển thị đã bỏ nguyên liệu */}
                    {removedIngredientIds.length > 0 && (
                      <div>
                        <p className="font-medium text-red-600 mb-1">Đã bỏ:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          {recipeModifications
                            .filter(mod => mod.sourceType === "REMOVED")
                            .map(mod => {
                              const ing = originalIngredients.find(ing => ing.id === mod.ingredientId)
                              if (!ing) return null
                              return (
                                <li key={mod.ingredientId} className="text-gray-700">
                                  {ing.name}: {mod.quantity} {ing.unit ? formatUnit(ing.unit) : ""}
                                </li>
                              )
                            })}
                        </ul>
                      </div>
                    )}
                    
                    {/* Hiển thị đã thêm nguyên liệu */}
                    {addedIngredients.length > 0 && (
                      <div>
                        <p className="font-medium text-green-600 mb-1">Đã thêm:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          {addedIngredients.map(added => {
                            const ingredient = allIngredients.find(ing => ing.id === added.id)
                            if (!ingredient) return null
                            const addedPrice = ingredient.pricePerUnit ? ingredient.pricePerUnit * added.quantity : 0
                            return (
                              <li key={added.id} className="text-gray-700">
                                {ingredient.name}: {added.quantity} {formatUnit(ingredient.unit)}
                                {addedPrice > 0 && (
                                  <span className="text-orange-600 ml-1">
                                    (+{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(addedPrice)})
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hiển thị thông tin size và số lượng */}
                <div className="mt-2 text-xs text-gray-500">
                  Size: {selectedSize} • Số lượng: {quantity}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 sticky bottom-0 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 text-sm"
          >
            Hủy
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={loading || !dishDetails}
            className="px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm"
          >
            Thêm vào giỏ ({new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)})
          </Button>
        </div>
      </div>
    </div>
  )
}
