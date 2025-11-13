import React, { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { X, Plus, Minus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@components/ui/button"
import { toast } from "sonner"
import { useIngredientStore } from "@/zustand/stores/ingredients"
import { useCartStore } from "@/zustand/stores/cart"
import { useDishStore } from "@/zustand/stores/dish"
import type { DishItem } from "@/zustand/slices/dish/list.slice"
import type { StoreIngredient } from "@/zustand/types"
import type { Dish } from "@models/dish/dish"
import type { DishTemplateItem } from "@/zustand/slices/dish/template.slice"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import { normalizeImageUrl } from "@/utils/file"

interface PresetDishModalProps {
  open: boolean
  onClose: () => void
  dish: DishItem | null
  editingItemId?: number | null
  initialData?: {
    size: "S" | "M" | "L"
    recipeModifications: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }>
    quantity: number
  } | null
  onSave?: (dish: Dish, quantity: number, notes: string) => void
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

const normalizeQuantity = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  if (value === 0) return 0
  const abs = Math.abs(value)
  const precision = abs < 1 ? 3 : abs < 10 ? 2 : 1
  return Number(value.toFixed(precision))
}

const convertQuantityForDisplay = (value: number, unit?: string): number => {
  if (!Number.isFinite(value)) return 0
  if (!unit) return normalizeQuantity(value)

  const unitUpper = unit.toUpperCase()
  if (unitUpper === "LITER") {
    return normalizeQuantity(value * 1000)
  }
  if (unitUpper === "KILOGRAM") {
    return normalizeQuantity(value * 1000)
  }
  return normalizeQuantity(value)
}

const formatQuantityDisplay = (value: number, unit?: string): string => {
  const displayValue = convertQuantityForDisplay(value, unit)
  return Number.isInteger(displayValue) ? displayValue.toString() : displayValue.toString()
}

const formatQuantityWithUnit = (value: number, unit?: string): string => {
  const unitLabel = formatUnit(unit)
  const quantityText = formatQuantityDisplay(value, unit)
  return unitLabel ? `${quantityText} ${unitLabel}` : quantityText
}

export default function PresetDishModal({ open, onClose, dish, editingItemId, initialData, onSave }: PresetDishModalProps) {
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

  // Fetch dish details, ingredients, and templates
  useEffect(() => {
    if (open && dish?.id) {
      setLoading(true)
      let isMounted = true // Flag để tránh update state nếu component đã unmount
      
      // Reset dishDetails khi mở modal mới
      setDishDetails(null)
      
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
                imageUrl: normalizeImageUrl(dishDataFromApi.imageUrl),
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
          console.error("PresetDishModal: Error fetching dish details:", err)
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
    } else if (open && !dish?.id) {
      setLoading(false)
      setDishDetails(null)
    }
  }, [open, dish?.id, fetchIngredients, fetchCategories, fetchTemplates])

  // Reset when modal closes or restore initialData when opening
  useEffect(() => {
    if (!open) {
      setSelectedSize("M")
      setSelectedTemplate(null)
      setRecipeModifications([])
      setSelectedCategoryId(null)
      setQuantity(1)
      setDishDetails(null)
    } else if (open && initialData) {
      // Khôi phục state từ initialData
      setSelectedSize(initialData.size)
      setRecipeModifications(initialData.recipeModifications)
      setQuantity(initialData.quantity)
    }
  }, [open, initialData])

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

  // Get original ingredients count by category priority (từ món ăn gốc)
  const getOriginalCountByPriority = (priority: number) => {
    return originalIngredients.filter(ing => {
      const fullIngredient = allIngredients.find(aIng => aIng.id === ing.id)
      const category = ingredientCategories.find(cat => cat.id === fullIngredient?.categoryId)
      return category?.priority === priority
    }).length
  }

  // Get added ingredients count by category priority
  const getAddedCountByPriority = (priority: number) => {
    return addedIngredients.filter(added => {
      const ingredient = allIngredients.find(ing => ing.id === added.id)
      const category = ingredientCategories.find(cat => cat.id === ingredient?.categoryId)
      return category?.priority === priority
    }).length
  }

  // Get total count by priority (original + added)
  const getTotalCountByPriority = (priority: number) => {
    return getOriginalCountByPriority(priority) + getAddedCountByPriority(priority)
  }

  // Check if can add more ingredients for a category priority
  const canAddMoreForPriority = (priority: number) => {
    if (!selectedTemplate) return true
    
    const totalCount = getTotalCountByPriority(priority)
    // priority 1 = carb, 2 = protein, 3 = vegetable
    if (priority === 1) {
      return !selectedTemplate.max_Carb || totalCount < selectedTemplate.max_Carb
    }
    if (priority === 2) {
      return !selectedTemplate.max_Protein || totalCount < selectedTemplate.max_Protein
    }
    if (priority === 3) {
      return !selectedTemplate.max_Vegetable || totalCount < selectedTemplate.max_Vegetable
    }
    return true // Other priorities (side dishes) không có limit
  }

  // Get ingredient categories for available ingredients (bao gồm cả đã thêm để hiển thị)
  const availableCategories = useMemo(() => {
    const categoryIds = new Set(availableIngredients.map(ing => ing.categoryId).filter(Boolean))
    return ingredientCategories.filter(cat => categoryIds.has(cat.id))
  }, [availableIngredients, ingredientCategories])

  // Get ingredients for selected category (bao gồm cả đã thêm - giống CustomBowlModal)
  const ingredientsForCategory = useMemo(() => {
    if (!selectedCategoryId) return availableIngredients
    return availableIngredients.filter(ing => ing.categoryId === selectedCategoryId)
  }, [availableIngredients, selectedCategoryId])

  // Auto-select first category
  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(availableCategories[0].id)
    }
  }, [availableCategories, selectedCategoryId])

  // Handle remove ingredient by percentage or fixed amount
  const handleRemoveByPercentage = (ingredientId: number, percentage: number) => {
    const originalIng = originalIngredients.find(ing => ing.id === ingredientId)
    if (!originalIng) return
    
    const removeAmount = Math.round((originalIng.neededQuantity * percentage) / 100)
    const finalQuantity = Math.min(removeAmount, originalIng.neededQuantity)
    
    if (finalQuantity > 0) {
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
    }
  }

  // Handle remove ingredient by fixed amount
  const handleRemoveByAmount = (ingredientId: number, amount: number) => {
    const originalIng = originalIngredients.find(ing => ing.id === ingredientId)
    if (!originalIng) return
    
    const removedMod = recipeModifications.find(mod => mod.ingredientId === ingredientId && mod.sourceType === "REMOVED")
    const currentRemoved = removedMod?.quantity || 0
    const newRemoved = Math.min(currentRemoved + amount, originalIng.neededQuantity)
    const finalQuantity = Math.max(0, newRemoved)
    
    if (finalQuantity > 0) {
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
    } else {
      // Nếu = 0, xóa modification
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "REMOVED")))
    }
  }

  // Get step amount for ingredient based on unit
  const getStepAmount = (unit?: string): number => {
    if (!unit) return 200
    const unitUpper = unit.toUpperCase()
    switch (unitUpper) {
      case "PCS":
        return 1
      case "GRAM":
        return 200
      case "KILOGRAM":
        return 0.2
      case "LITER":
        return 0.2
      default:
        return 200
    }
  }

  // Giới hạn tổng số lượng nguyên liệu có thể thêm (giống các web food ordering)
  const MAX_TOTAL_ADDON_INGREDIENTS = 10 // Tối đa 10 nguyên liệu

  // Giới hạn số lượng tối đa cho mỗi nguyên liệu theo đơn vị (giống các quán ăn/web khác)
  // - PCS (phần): tối đa 3 phần
  // - GRAM: tối đa 500 gram (0.5kg) 
  // - KILOGRAM: tối đa 0.5 kg
  // - LITER: tối đa 0.5 liter
  const getMaxQuantityForUnit = (unit?: string): number => {
    if (!unit) return 500
    const unitUpper = unit.toUpperCase()
    switch (unitUpper) {
      case "PCS":
        return 3 // Tối đa 3 phần
      case "GRAM":
        return 500 // Tối đa 500 gram
      case "KILOGRAM":
        return 0.5 // Tối đa 0.5 kg
      case "LITER":
        return 0.5 // Tối đa 0.5 liter
      default:
        return 500 // Mặc định 500
    }
  }

  // Handle add ingredient with category limit check - Giống CustomBowlModal
  const handleAddIngredient = (ingredient: StoreIngredient) => {
    // Hết hàng thì không cho chọn
    if ((ingredient.available ?? 0) <= 0) {
      toast.error("Nguyên liệu này đã hết hàng")
      return
    }

    const existing = recipeModifications.find(mod => mod.ingredientId === ingredient.id && mod.sourceType === "ADDON")
    if (existing) {
      // Remove the add modification - luôn cho phép remove
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredient.id && mod.sourceType === "ADDON")))
    } else {
      // Kiểm tra giới hạn tổng số lượng nguyên liệu có thể thêm (tính từ recipeModifications)
      const currentAddonCount = recipeModifications.filter(mod => mod.sourceType === "ADDON").length
      if (currentAddonCount >= MAX_TOTAL_ADDON_INGREDIENTS) {
        toast.warning(`Bạn chỉ có thể thêm tối đa ${MAX_TOTAL_ADDON_INGREDIENTS} nguyên liệu`)
        return
      }

      // Kiểm tra số lượng có sẵn trong kho (available) và giới hạn tối đa theo đơn vị
      const defaultQuantity = getStepAmount(ingredient.unit)
      const maxAvailable = ingredient.available ?? Infinity
      const maxQuantityByUnit = getMaxQuantityForUnit(ingredient.unit)
      const maxQuantity = Math.min(maxAvailable, maxQuantityByUnit)
      
      // Kiểm tra số lượng mặc định không vượt quá giới hạn
      if (defaultQuantity > maxQuantity) {
      if (defaultQuantity > maxAvailable) {
        toast.warning(`Số lượng có sẵn trong kho không đủ. Hiện có: ${formatQuantityWithUnit(maxAvailable, ingredient.unit)}`)
      } else {
        toast.warning(`Số lượng tối đa cho ${ingredient.name} là ${formatQuantityWithUnit(maxQuantityByUnit, ingredient.unit)}`)
        }
        return
      }

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
      
      // Add the ingredient with default quantity (dùng getStepAmount để nhất quán)
      setRecipeModifications(prev => [
        ...prev.filter(mod => !(mod.ingredientId === ingredient.id && mod.sourceType === "REMOVED")),
        {
          ingredientId: ingredient.id,
          quantity: defaultQuantity,
          sourceType: "ADDON" as const,
        }
      ])
    }
  }

  // Handle add/subtract quantity for added ingredient
  const handleAdjustQuantity = (ingredientId: number, delta: number) => {
    const ingredient = allIngredients.find(ing => ing.id === ingredientId)
    if (!ingredient) return

    const addedMod = recipeModifications.find(mod => mod.ingredientId === ingredientId && mod.sourceType === "ADDON")

    if (!addedMod) {
      if (delta > 0) {
        handleAddIngredient(ingredient)
      }
      return
    }

    const currentQty = addedMod.quantity
    const stepAmount = getStepAmount(ingredient.unit)
    const newQty = currentQty + (delta * stepAmount)
    const maxAvailable = ingredient.available ?? Infinity
    const maxQuantityByUnit = getMaxQuantityForUnit(ingredient.unit)
    const maxQuantity = Math.min(maxAvailable, maxQuantityByUnit)
    
    // Nếu đang tăng số lượng (delta > 0), kiểm tra số lượng có sẵn trong kho và giới hạn tối đa theo đơn vị
    if (delta > 0 && newQty > maxQuantity) {
      if (newQty > maxAvailable) {
        toast.warning(`Số lượng có sẵn trong kho không đủ. Hiện có: ${formatQuantityWithUnit(maxAvailable, ingredient.unit)}`)
      } else {
        toast.warning(`Số lượng tối đa cho ${ingredient.name} là ${formatQuantityWithUnit(maxQuantityByUnit, ingredient.unit)}`)
      }
      return
    }
    
    const boundedQuantity = Math.min(newQty, maxQuantity)

    if (boundedQuantity <= 0 || boundedQuantity < stepAmount) {
      setRecipeModifications(prev => prev.filter(mod => !(mod.ingredientId === ingredientId && mod.sourceType === "ADDON")))
      return
    }

    setRecipeModifications(prev => prev.map(mod => 
      mod.ingredientId === ingredientId && mod.sourceType === "ADDON"
        ? { ...mod, quantity: boundedQuantity }
        : mod
    ))
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
    
    // Kiểm tra xem có thay đổi nguyên liệu không
    const hasModifications = recipeModifications.length > 0
    
    // Generate name với thông tin chỉnh sửa (chỉ khi có thay đổi)
    let dishName = dishDetails.name
    if (hasModifications) {
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
      img_url: normalizeImageUrl(dishDetails.imageUrl || dish.imageUrl) || "",
      account_id: 0,
      dish_category_id: dish.categoryId || 0,
      type: "single",
      description: dishDetails.description || "",
      is_public: dish.public !== false,
      used: dish.usedQuantity || 0,
    }
    
    // Chỉ tạo modificationData khi có thay đổi nguyên liệu
    // Nếu không có thay đổi, để CheckoutPage xử lý như preset không tùy chỉnh (dùng dishId)
    let notes: string | undefined = undefined
    if (hasModifications) {
      // Có thay đổi: tạo modificationData với basedOnId
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
      notes = JSON.stringify(modificationData)
    } else if (selectedSize !== "M") {
      // Không có thay đổi nhưng size khác M: vẫn cần lưu size để CheckoutPage xử lý
      // Tạo modificationData nhưng không có basedOnId (để CheckoutPage dùng dishId)
      const modificationData = {
        dishTemplate: { size: selectedSize },
        recipe: [],
      }
      notes = JSON.stringify(modificationData)
    }
    // Nếu không có thay đổi và size là M: không tạo notes (để CheckoutPage xử lý như preset không tùy chỉnh)
    
    // Nếu có onSave (từ CreateOrderModal), luôn gọi onSave
    // Nếu không có onSave (customer flow), gọi addItem
    if (onSave) {
      onSave(dishForCart, quantity, notes || "")
    } else {
      // Add to cart (customer flow)
      addItem(dishForCart, quantity, notes)
      
      toast.success("Đã thêm vào giỏ hàng", {
        description: `${dishName} (Size: ${selectedSize}, SL: ${quantity})${hasModifications ? ` với ${recipeModifications.length} thay đổi` : ""}`,
      })
    }
    
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

  // Tạo portal container với z-index cao nhất (cùng với Dialog nhưng render sau nên sẽ hiển thị trên)
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 p-4"
      style={{ 
        zIndex: 2147483647, 
        pointerEvents: 'auto', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
        paddingTop: '2rem', 
        paddingBottom: '2rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
      onClick={(e) => {
        // Đóng modal khi click vào overlay
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          onClose()
        }
      }}
      onWheel={(e) => {
        // Cho phép scroll trong modal con
        e.stopPropagation()
      }}
      onTouchMove={(e) => {
        // Cho phép touch scroll trong modal con
        e.stopPropagation()
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '90vh', 
          margin: 'auto 0', 
          display: 'flex', 
          flexDirection: 'column',
          height: 'fit-content',
          minHeight: 'min-content'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b bg-white flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{dishDetails?.name || dish?.name || "Món ăn"}</h2>
            {dishDetails?.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">{dishDetails.description}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div 
          className="overflow-y-auto p-5" 
          style={{ 
            flex: '1 1 auto', 
            minHeight: 0, 
            maxHeight: 'calc(90vh - 200px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onWheel={(e) => {
            // Đảm bảo scroll events không bị chặn
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            // Đảm bảo touch scroll không bị chặn
            e.stopPropagation()
          }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin món ăn...</p>
            </div>
          ) : !dish?.id ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không có thông tin món ăn</p>
            </div>
          ) : !dishDetails ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">Không thể tải thông tin món ăn</p>
              {dish?.id && <p className="text-sm text-gray-400">Dish ID: {dish.id}</p>}
            </div>
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
                  {originalIngredients.length > 0 ? (
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Nguyên liệu có sẵn ({originalIngredients.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {originalIngredients.map((ing) => {
                          const isRemoved = removedIngredientIds.includes(ing.id)
                          const removedMod = recipeModifications.find(mod => mod.ingredientId === ing.id && mod.sourceType === "REMOVED")
                          const removedQty = removedMod?.quantity || 0
                          const remainingQty = Math.max(0, ing.neededQuantity - removedQty)
                          
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
                                Khẩu phần: {formatQuantityDisplay(ing.neededQuantity, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""}
                              </p>
                              
                              {/* Nút giảm theo % */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveByPercentage(ing.id, 25)
                                  }}
                                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                >
                                  -25%
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveByPercentage(ing.id, 50)
                                  }}
                                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                >
                                  -50%
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveByPercentage(ing.id, 70)
                                  }}
                                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                >
                                  -70%
                                </button>
                              </div>
                              
                              {/* Nút điều chỉnh số lượng - Nút - là trừ (tăng số đã bỏ), Nút + là thêm lại (giảm số đã bỏ) */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Nút -: Trừ nguyên liệu (tăng số đã bỏ = giảm số còn lại)
                                      handleRemoveByAmount(ing.id, getStepAmount(ing.unit))
                                    }}
                                    className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs"
                                    disabled={removedQty >= ing.neededQuantity}
                                    title={`Trừ ${formatQuantityWithUnit(getStepAmount(ing.unit), ing.unit)}`}
                                  >
                                    <Minus size={14} className="mr-1" />
                                    <span>{formatQuantityDisplay(getStepAmount(ing.unit), ing.unit)}</span>
                                  </button>
                                  <span className="flex-1 text-center text-xs text-gray-700 font-medium">
                                    {formatQuantityDisplay(remainingQty, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Nút +: Thêm lại nguyên liệu (giảm số đã bỏ = tăng số còn lại)
                                      handleRemoveByAmount(ing.id, -getStepAmount(ing.unit))
                                    }}
                                    className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs"
                                    disabled={removedQty <= 0}
                                    title={`Thêm lại ${formatQuantityWithUnit(getStepAmount(ing.unit), ing.unit)}`}
                                  >
                                    <Plus size={14} className="mr-1" />
                                    <span>{formatQuantityDisplay(getStepAmount(ing.unit), ing.unit)}</span>
                                  </button>
                                </div>
                                
                                {/* Hiển thị thông tin */}
                                {removedQty > 0 && (
                                  <p className="text-xs text-gray-600 text-center pt-1 border-t border-gray-200">
                                    Đã bỏ: {formatQuantityDisplay(removedQty, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""} • Còn lại: {formatQuantityDisplay(remainingQty, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""}
                                  </p>
                                )}
                                {removedQty === 0 && (
                                  <p className="text-xs text-gray-500 text-center">
                                    Còn nguyên: {formatQuantityDisplay(ing.neededQuantity, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Add Ingredients */}
                  {availableIngredients.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900">Thêm nguyên liệu (Tính phí)</h3>
                        <div className="flex items-center gap-3">
                          {/* Hiển thị giới hạn tổng số lượng nguyên liệu */}
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">
                              Đã thêm: {addedIngredients.length}/{MAX_TOTAL_ADDON_INGREDIENTS}
                            </span>
                          </div>
                          {selectedTemplate && (
                            <div className="text-xs text-gray-600 space-x-3">
                              {selectedTemplate.max_Carb !== undefined && (
                                <span>
                                  Tinh Bột: {getTotalCountByPriority(1)}/{selectedTemplate.max_Carb}
                                </span>
                              )}
                              {selectedTemplate.max_Protein !== undefined && (
                                <span>
                                  Protein: {getTotalCountByPriority(2)}/{selectedTemplate.max_Protein}
                                </span>
                              )}
                              {selectedTemplate.max_Vegetable !== undefined && (
                                <span>
                                  Rau: {getTotalCountByPriority(3)}/{selectedTemplate.max_Vegetable}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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
                                  
                                  // Check if can add this ingredient based on category limit and total limit
                                  const ingredientCategory = ingredientCategories.find(cat => cat.id === ingredient.categoryId)
                                  const ingredientPriority = ingredientCategory?.priority || 0
                                  // Can add if:
                                  // 1. Priority is 0 or > 3 (no category limit), or haven't reached category max limit, or already added
                                  // 2. Haven't reached total addon ingredients limit, or already added
                                  const canAddByCategory = ingredientPriority === 0 || ingredientPriority > 3 || canAddMoreForPriority(ingredientPriority) || isAdded
                                  const currentAddonCount = recipeModifications.filter(mod => mod.sourceType === "ADDON").length
                                  const canAddByCount = isAdded || currentAddonCount < MAX_TOTAL_ADDON_INGREDIENTS
                                  const canAdd = canAddByCategory && canAddByCount
                                  
                                  const stepAmount = getStepAmount(ingredient.unit)
                                  const maxAvailable = ingredient.available ?? Infinity
                                  const maxQuantityByUnit = getMaxQuantityForUnit(ingredient.unit)
                                  const maxQuantity = Math.min(maxAvailable, maxQuantityByUnit)
                                  const canIncrease = isAdded
                                    ? (addedIng ? addedIng.quantity < maxQuantity : false)
                                    : canAdd && (ingredient.available ?? 0) > 0
                                  const displayQuantity = addedIng ? addedIng.quantity : 0

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
                                        // Giống CustomBowlModal: chỉ cần kiểm tra canAdd và gọi handleAddIngredient
                                        // handleAddIngredient sẽ tự xử lý toggle (thêm nếu chưa có, xóa nếu đã có)
                                        if (canAdd) {
                                          handleAddIngredient(ingredient)
                                        } else {
                                          // Nếu không thể thêm (đạt giới hạn), hiển thị thông báo
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
                                      {/* Chỉ hiển thị giá đơn vị khi chưa thêm */}
                                      {!isAdded && ingredient.pricePerUnit !== undefined && (
                                        <p className="text-xs text-gray-600 mb-2">
                                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ingredient.pricePerUnit)}/{formatUnit(ingredient.unit)}
                                        </p>
                                      )}
                                      <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAdjustQuantity(ingredient.id, -1)
                                            }}
                                            className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs disabled:opacity-50"
                                            disabled={!isAdded}
                                            title={`Giảm ${formatQuantityWithUnit(stepAmount, ingredient.unit)}`}
                                          >
                                            <Minus size={14} className="mr-1" />
                                            <span>{formatQuantityDisplay(stepAmount, ingredient.unit)}</span>
                                          </button>
                                          <span className="flex-1 text-center text-xs text-gray-700 font-medium">
                                            {formatQuantityDisplay(displayQuantity, ingredient.unit)} {formatUnit(ingredient.unit)}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAdjustQuantity(ingredient.id, 1)
                                            }}
                                            className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs disabled:opacity-50"
                                            disabled={!canIncrease}
                                            title={`Thêm ${formatQuantityWithUnit(stepAmount, ingredient.unit)}`}
                                          >
                                            <Plus size={14} className="mr-1" />
                                            <span>{formatQuantityDisplay(stepAmount, ingredient.unit)}</span>
                                          </button>
                                        </div>
                                        {isAdded && addedIng && ingredient.pricePerUnit && (
                                          <p className="text-xs font-semibold text-orange-600 text-center">
                                            +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(ingredient.pricePerUnit * addedIng.quantity))}
                                          </p>
                                        )}
                                        {isAdded && (
                                          <div className="text-orange-500 flex justify-center">
                                            <Check size={14} />
                                          </div>
                                        )}
                                      </div>
                                      {!isAdded && !canAdd && (ingredient.available ?? 0) > 0 && (
                                        <div className="w-full mt-2 px-3 py-1 text-xs font-medium text-yellow-600 border border-yellow-500 rounded-lg text-center bg-yellow-50">
                                          Đã đạt giới hạn
                                        </div>
                                      )}
                                      {!isAdded && (ingredient.available ?? 0) <= 0 && (
                                        <div className="w-full mt-2 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-300 rounded-lg text-center">
                                          Hết hàng
                                        </div>
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
                        <ul className="space-y-1.5">
                          {recipeModifications
                            .filter(mod => mod.sourceType === "REMOVED")
                            .map(mod => {
                              const ing = originalIngredients.find(ing => ing.id === mod.ingredientId)
                              if (!ing) return null
                              return (
                                <li key={mod.ingredientId} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:border-red-300 transition-colors">
                                  <span className="text-gray-700 text-sm">
                                    {ing.name}: {formatQuantityDisplay(mod.quantity, ing.unit)} {ing.unit ? formatUnit(ing.unit) : ""}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setRecipeModifications(prev => prev.filter(m => !(m.ingredientId === mod.ingredientId && m.sourceType === "REMOVED")))
                                    }}
                                    className="flex-shrink-0 ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Hủy bỏ"
                                  >
                                    <X size={16} />
                                  </button>
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
                        <ul className="space-y-1.5">
                          {addedIngredients.map(added => {
                            const ingredient = allIngredients.find(ing => ing.id === added.id)
                            if (!ingredient) return null
                            const addedPrice = ingredient.pricePerUnit ? ingredient.pricePerUnit * added.quantity : 0
                            return (
                              <li key={added.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:border-orange-300 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <span className="text-gray-700 text-sm">
                                    {ingredient.name}: {formatQuantityDisplay(added.quantity, ingredient.unit)} {formatUnit(ingredient.unit)}
                                  </span>
                                  {addedPrice > 0 && (
                                    <span className="text-orange-600 ml-1 text-sm font-semibold">
                                      (+{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(addedPrice)})
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddIngredient(ingredient)}
                                  className="flex-shrink-0 ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Gỡ nguyên liệu"
                                >
                                  <X size={16} />
                                </button>
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
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="px-4 text-sm"
          >
            Hủy
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
            }}
            disabled={loading || !dishDetails}
            className="px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm"
          >
            {editingItemId ? "Cập nhật" : "Thêm vào giỏ"} ({new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)})
          </Button>
        </div>
      </div>
    </div>
  )

  // Sử dụng createPortal để render modal ra ngoài Dialog, đảm bảo z-index cao nhất
  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null
}
