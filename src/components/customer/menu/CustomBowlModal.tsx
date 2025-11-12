import React, { useState, useEffect, useMemo, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Check, Plus, Minus } from "lucide-react"
import { Button } from "@components/ui/button"
import { toast } from "sonner"
import { useDishStore } from "@/zustand/stores/dish"
import { useIngredientStore } from "@/zustand/stores/ingredients"
import { useCartStore } from "@/zustand/stores/cart"
import type { DishTemplateItem } from "@/zustand/slices/dish/template.slice"
import type { StoreIngredient } from "@/zustand/types"
import type { Dish } from "@models/dish/dish"

interface CustomBowlModalProps {
  open: boolean
  onClose: () => void
  editingItemId?: number | null
  initialData?: {
    template: DishTemplateItem
    selectedIngredients: Array<{ ingredientId: number; quantity: number; categoryId: number; priority: number }>
  } | null
  onSave?: (dish: Dish, quantity: number, notes: string) => void
}

interface SelectedIngredient {
  ingredientId: number
  quantity: number
  categoryId: number
  priority: number
}

type Step = "size" | "carb" | "protein" | "vegetable" | "side"

const STEP_LABELS: Record<Step, string> = {
  size: "Chọn tô",
  carb: "Tinh Bột",
  protein: "Protein",
  vegetable: "Rau",
  side: "Món Kèm",
}

const STEP_ORDER: Step[] = ["size", "carb", "protein", "vegetable", "side"]

const normalizeQuantity = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  if (value === 0) return 0
  const abs = Math.abs(value)
  const precision = abs < 1 ? 3 : abs < 10 ? 2 : 1
  return Number(value.toFixed(precision))
}

const formatQuantityDisplay = (value: number): string => normalizeQuantity(value).toString()

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

// Format unit từ API sang hiển thị
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

export default function CustomBowlModal({ open, onClose, editingItemId, initialData, onSave }: CustomBowlModalProps) {
  const { templates, fetchTemplates } = useDishStore()
  const { items: ingredients, fetchAll: fetchIngredients, categories: ingredientCategories, fetchCategories } = useIngredientStore()
  const { addItem } = useCartStore()
  
  const [currentStep, setCurrentStep] = useState<Step>("size")
  const [selectedTemplate, setSelectedTemplate] = useState<DishTemplateItem | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const ingScrollRef = useRef<HTMLDivElement | null>(null)
  const catScrollRef = useRef<HTMLDivElement | null>(null)
  const [showCatLeftArrow, setShowCatLeftArrow] = useState(false)
  const [showCatRightArrow, setShowCatRightArrow] = useState(false)
  const [showIngLeftArrow, setShowIngLeftArrow] = useState(false)
  const [showIngRightArrow, setShowIngRightArrow] = useState(false)

  // Fetch data
  useEffect(() => {
    if (open) {
      setLoading(true)
      Promise.all([
        fetchTemplates(),
        fetchIngredients(),
        fetchCategories()
      ]).then(() => {
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [open, fetchTemplates, fetchIngredients, fetchCategories])

  // Reset when modal closes or restore initialData when opening
  useEffect(() => {
    if (!open) {
      setCurrentStep("size")
      setSelectedTemplate(null)
      setSelectedIngredients([])
      setSelectedCategoryId(null)
    } else if (open && initialData) {
      // Khôi phục state từ initialData
      setSelectedTemplate(initialData.template)
      // Khôi phục selectedIngredients với đầy đủ thông tin từ ingredients
      const restoredIngredients: SelectedIngredient[] = initialData.selectedIngredients.map(selIng => {
        const ingredient = ingredients.find(ing => ing.id === selIng.ingredientId)
        const category = ingredientCategories.find(cat => 
          cat.id === selIng.categoryId || 
          (ingredient && ingredient.categoryId === cat.id)
        )
        return {
          ingredientId: selIng.ingredientId,
          quantity: selIng.quantity,
          categoryId: category?.id || selIng.categoryId || 0,
          priority: category?.priority || selIng.priority || 0,
        }
      })
      setSelectedIngredients(restoredIngredients)
      // Xác định step hiện tại dựa trên selectedIngredients
      if (restoredIngredients.length > 0) {
        // Tìm step cao nhất đã có ingredients
        const maxPriority = Math.max(...restoredIngredients.map(ing => ing.priority))
        if (maxPriority >= 4) {
          setCurrentStep("side")
        } else if (maxPriority >= 3) {
          setCurrentStep("vegetable")
        } else if (maxPriority >= 2) {
          setCurrentStep("protein")
        } else if (maxPriority >= 1) {
          setCurrentStep("carb")
        } else {
          setCurrentStep("size")
        }
      } else {
        setCurrentStep("size")
      }
    }
  }, [open, initialData, ingredients, ingredientCategories])

  // Get ingredients for current step based on priority
  const stepPriority: Record<Step, number> = {
    size: 0,
    carb: 1,
    protein: 2,
    vegetable: 3,
    side: 4,
  }

  const currentPriority = stepPriority[currentStep]
  
  // Get categories for current step
  const categoriesForStep = useMemo(() => {
    if (currentStep === "size") return []
    const cats = ingredientCategories.filter(cat => cat.priority === currentPriority)
    // Sắp danh mục: có nguyên liệu trước, rỗng xếp sau
    return [...cats].sort((a, b) => {
      const aHas = ingredients.some(ing => ing.categoryId === a.id && ing.active !== false && (ing.available ?? 0) > 0)
      const bHas = ingredients.some(ing => ing.categoryId === b.id && ing.active !== false && (ing.available ?? 0) > 0)
      if (aHas === bHas) return (a.name || "").localeCompare(b.name || "")
      return aHas ? -1 : 1
    })
  }, [ingredientCategories, currentStep, currentPriority, ingredients])

  // Get all ingredients for current step (all categories with same priority)
  const ingredientsForStep = useMemo(() => {
    if (currentStep === "size") return []
    const categoryIds = categoriesForStep.map(cat => cat.id)
    return ingredients.filter(ing => 
      ing.active !== false && 
      ing.categoryId !== undefined &&
      categoryIds.includes(ing.categoryId)
    )
  }, [ingredients, categoriesForStep, currentStep])

  // Get ingredients for selected category (if category selector is shown)
  const ingredientsForCategory = useMemo(() => {
    if (currentStep === "size") return []
    if (categoriesForStep.length > 1 && selectedCategoryId) {
      return ingredientsForStep.filter(ing => ing.categoryId === selectedCategoryId)
    }
    // If only one category or no category selector, show all ingredients for step
    return ingredientsForStep
  }, [ingredientsForStep, selectedCategoryId, categoriesForStep, currentStep])

  // Reset category selection and scroll positions when step changes
  useEffect(() => {
    // Reset scroll positions về đầu sau khi DOM update
    setTimeout(() => {
      if (catScrollRef.current) {
        catScrollRef.current.scrollLeft = 0
      }
      if (ingScrollRef.current) {
        ingScrollRef.current.scrollLeft = 0
      }
      
      // Update scroll button states
      checkScrollPosition(catScrollRef, setShowCatLeftArrow, setShowCatRightArrow)
      checkScrollPosition(ingScrollRef, setShowIngLeftArrow, setShowIngRightArrow)
    }, 50)
    
    if (currentStep === "size") {
      setSelectedCategoryId(null)
    } else if (categoriesForStep.length > 0) {
      // Auto-select first category when entering a new step
      const firstCategoryId = categoriesForStep[0].id
      // Only update if selectedCategoryId is null or not in current step's categories
      if (selectedCategoryId === null || !categoriesForStep.some(cat => cat.id === selectedCategoryId)) {
        setSelectedCategoryId(firstCategoryId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]) // Only depend on currentStep to reset when step changes

  // Get selected ingredients count by priority
  const getSelectedCountByPriority = (priority: number) => {
    return selectedIngredients.filter(ing => ing.priority === priority).length
  }

  // Check if can add more ingredients for current step
  const canAddMore = () => {
    if (!selectedTemplate || currentStep === "size") return true
    
    const count = getSelectedCountByPriority(currentPriority)
    if (currentStep === "carb") {
      return !selectedTemplate.max_Carb || count < (selectedTemplate.max_Carb || 0)
    }
    if (currentStep === "protein") {
      return !selectedTemplate.max_Protein || count < (selectedTemplate.max_Protein || 0)
    }
    if (currentStep === "vegetable") {
      return !selectedTemplate.max_Vegetable || count < (selectedTemplate.max_Vegetable || 0)
    }
    return true // side dishes không có limit
  }
  
  // Get max limit for current step
  const getMaxLimit = () => {
    if (!selectedTemplate) return null
    if (currentStep === "carb") return selectedTemplate.max_Carb ?? null
    if (currentStep === "protein") return selectedTemplate.max_Protein ?? null
    if (currentStep === "vegetable") return selectedTemplate.max_Vegetable ?? null
    return null
  }
  
  // Get current count for step
  const getCurrentCount = () => {
    return getSelectedCountByPriority(currentPriority)
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

  // Handle ingredient selection với validation chặt chẽ
  const handleIngredientToggle = (ingredient: StoreIngredient) => {
    // Hết hàng thì không cho chọn
    if ((ingredient.available ?? 0) <= 0) {
      toast.error("Nguyên liệu này đã hết hàng")
      return
    }

    const existing = selectedIngredients.find(ing => ing.ingredientId === ingredient.id)
    if (existing) {
      // Remove ingredient - luôn cho phép remove
      setSelectedIngredients(prev => prev.filter(ing => ing.ingredientId !== ingredient.id))
    } else {
      // Kiểm tra xem có thể thêm mới không (validate số lượng items, không phải quantity)
      const currentCount = getSelectedCountByPriority(currentPriority)
      const maxLimit = getMaxLimit()
      
      if (maxLimit !== null && currentCount >= maxLimit) {
        toast.warning(`Bạn chỉ có thể chọn tối đa ${maxLimit} ${STEP_LABELS[currentStep].toLowerCase()}`)
        return
      }
      
      // Lấy quantityRatio từ template (nếu có), mặc định là 1
      const quantityRatio = selectedTemplate?.quantityRatio || 1
      
      // Kiểm tra số lượng có sẵn trong kho (available) và giới hạn tối đa theo đơn vị
      const baseDefaultQuantity = getStepAmount(ingredient.unit)
      // Áp dụng quantityRatio vào số lượng mặc định
      const defaultQuantity = normalizeQuantity(baseDefaultQuantity * quantityRatio)
      
      const maxAvailable = ingredient.available ?? Infinity
      const maxQuantityByUnit = getMaxQuantityForUnit(ingredient.unit)
      // Max quantity sau khi scale theo quantityRatio (nhưng không được vượt quá available)
      const maxQuantityScaled = normalizeQuantity(maxQuantityByUnit * quantityRatio)
      const maxQuantity = Math.min(maxAvailable, maxQuantityScaled)
      
      // Kiểm tra số lượng mặc định không vượt quá giới hạn
      if (defaultQuantity > maxQuantity) {
        if (defaultQuantity > maxAvailable) {
          toast.warning(`Số lượng có sẵn trong kho không đủ. Hiện có: ${maxAvailable} ${formatUnit(ingredient.unit)}`)
        } else {
          toast.warning(`Số lượng tối đa cho ${ingredient.name} là ${maxQuantityByUnit} ${formatUnit(ingredient.unit)}`)
        }
        return
      }
      
      // Add ingredient với số lượng đã scale theo quantityRatio
      const category = ingredientCategories.find(cat => cat.id === ingredient.categoryId)
      
      setSelectedIngredients(prev => [...prev, {
        ingredientId: ingredient.id,
        quantity: defaultQuantity,
        categoryId: ingredient.categoryId || 0,
        priority: category?.priority || 0,
      }])
    }
  }

  // Handle add/subtract quantity for selected ingredient
  const handleAdjustQuantity = (ingredientId: number, delta: number) => {
    const selectedIng = selectedIngredients.find(ing => ing.ingredientId === ingredientId)
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    if (!ingredient || !selectedIng) return
    
    // Lấy quantityRatio từ template (nếu có), mặc định là 1
    const quantityRatio = selectedTemplate?.quantityRatio || 1
    
    const currentQty = selectedIng.quantity
    const baseStepAmount = getStepAmount(ingredient.unit)
    // Áp dụng quantityRatio vào step amount
    const stepAmount = normalizeQuantity(baseStepAmount * quantityRatio)
    const newQty = normalizeQuantity(currentQty + (delta * stepAmount))
    const maxAvailable = ingredient.available ?? Infinity
    const maxQuantityByUnit = getMaxQuantityForUnit(ingredient.unit)
    // Max quantity sau khi scale theo quantityRatio (nhưng không được vượt quá available)
    const maxQuantityScaled = normalizeQuantity(maxQuantityByUnit * quantityRatio)
    const maxQuantity = Math.min(maxAvailable, maxQuantityScaled)
    // Minimum quantity sau khi scale theo quantityRatio
    const minQuantity = normalizeQuantity(getStepAmount(ingredient.unit) * quantityRatio)
    
    // Nếu đang tăng số lượng (delta > 0), kiểm tra số lượng có sẵn trong kho và giới hạn tối đa theo đơn vị
    if (delta > 0 && newQty > maxQuantity) {
      if (newQty > maxAvailable) {
        toast.warning(`Số lượng có sẵn trong kho không đủ. Hiện có: ${maxAvailable} ${formatUnit(ingredient.unit)}`)
      } else {
        toast.warning(`Số lượng tối đa cho ${ingredient.name} là ${maxQuantityByUnit} ${formatUnit(ingredient.unit)}`)
      }
      return
    }
    
    const finalQuantity = Math.max(minQuantity, Math.min(newQty, maxQuantity))
    
    // Nếu finalQuantity >= minQuantity, cập nhật quantity
    // Nếu finalQuantity < minQuantity, xóa ingredient (không giữ lại với số lượng quá nhỏ)
    if (finalQuantity >= minQuantity) {
      setSelectedIngredients(prev => prev.map(ing =>
        ing.ingredientId === ingredientId
          ? { ...ing, quantity: normalizeQuantity(finalQuantity) }
          : ing
      ))
    } else {
      // Nếu giảm xuống dưới minQuantity, xóa ingredient
      setSelectedIngredients(prev => prev.filter(ing => ing.ingredientId !== ingredientId))
    }
  }

  // Base price constant (có thể lấy từ config sau)
  const BASE_BOWL_PRICE = 16500

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedTemplate) return BASE_BOWL_PRICE
    
    // Base price từ template: basePrice * priceRatio
    let price = BASE_BOWL_PRICE * selectedTemplate.priceRatio
    
    // Add ingredient prices: pricePerUnit * quantity
    // Lưu ý: quantity đã được scale theo quantityRatio trong handleIngredientToggle và handleAdjustQuantity
    // nên giá tính trực tiếp từ pricePerUnit * quantity (đã scale)
    selectedIngredients.forEach(selected => {
      const ingredient = ingredients.find(ing => ing.id === selected.ingredientId)
      if (ingredient && ingredient.pricePerUnit) {
        price += ingredient.pricePerUnit * selected.quantity
      }
    })
    
    return Math.round(price)
  }, [selectedTemplate, selectedIngredients, ingredients])

  // Handle next step
  const handleNext = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1])
      setSelectedCategoryId(null) // Reset category selection for next step
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
      setSelectedCategoryId(null)
    }
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedTemplate) return
    
    // Create custom dish object for cart
    // Store custom bowl data in notes as JSON string for later retrieval
    // Lưu ý: quantity đã được scale theo quantityRatio trong handleIngredientToggle và handleAdjustQuantity
    // nên khi gửi lên API, quantity đã là giá trị cuối cùng (đã nhân với quantityRatio)
    const customBowlData = {
      template: selectedTemplate,
      recipe: selectedIngredients.map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: normalizeQuantity(ing.quantity),
        sourceType: "ADDON" as const,
      })),
    }
    
    const customDish: Dish = {
      id: Date.now(), // Temporary ID (sẽ được tạo mới khi đặt hàng)
      name: `Custom Bowl ${selectedTemplate.size}`,
      price: totalPrice,
      img_url: "", // Empty string for custom bowls
      account_id: 0, // Will be set when ordering
      dish_category_id: 0, // Will be set when ordering
      type: "custom",
      description: `Tô tùy chỉnh ${selectedTemplate.size} với ${selectedIngredients.length} nguyên liệu`,
      is_public: true,
      used: 0,
    }
    
    // Nếu đang edit, gọi onSave; nếu không, add mới
    if (editingItemId && onSave) {
      onSave(customDish, 1, JSON.stringify(customBowlData))
    } else {
      // Store custom bowl data in notes as JSON
      addItem(customDish, 1, JSON.stringify(customBowlData))
      
      // Show success toast
      toast.success("Đã thêm vào giỏ hàng", {
        description: `Custom Bowl ${selectedTemplate.size} với ${selectedIngredients.length} nguyên liệu`,
      })
    }
    
    onClose()
  }

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === "size") {
      return selectedTemplate !== null
    }
    // Other steps are optional, but we can require at least one selection
    return true
  }

  // Check scroll position để hiển thị/ẩn nút điều hướng
  const checkScrollPosition = (ref: React.RefObject<HTMLDivElement>, setLeft: (show: boolean) => void, setRight: (show: boolean) => void) => {
    if (!ref.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = ref.current
    setLeft(scrollLeft > 10)
    setRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Handle scroll để cập nhật trạng thái nút
  const handleCategoryScroll = () => {
    checkScrollPosition(catScrollRef, setShowCatLeftArrow, setShowCatRightArrow)
  }

  const handleIngredientScroll = () => {
    checkScrollPosition(ingScrollRef, setShowIngLeftArrow, setShowIngRightArrow)
  }

  // Kiểm tra scroll position khi categories/ingredients thay đổi
  useEffect(() => {
    if (categoriesForStep.length > 1) {
      setTimeout(() => {
        checkScrollPosition(catScrollRef, setShowCatLeftArrow, setShowCatRightArrow)
      }, 100)
    }
  }, [categoriesForStep, selectedCategoryId])

  useEffect(() => {
    if (ingredientsForCategory.length > 0) {
      setTimeout(() => {
        checkScrollPosition(ingScrollRef, setShowIngLeftArrow, setShowIngRightArrow)
      }, 100)
    }
  }, [ingredientsForCategory])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Tạo tô của bạn</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEP_ORDER.map((step, index) => {
              const stepIndex = STEP_ORDER.indexOf(currentStep)
              const isCompleted = stepIndex > index
              const isCurrent = stepIndex === index
              
              return (
                <React.Fragment key={step}>
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isCurrent
                          ? "bg-orange-500 text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : index + 1}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isCurrent ? "text-orange-500" : isCompleted ? "text-green-500" : "text-gray-500"
                    }`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {index < STEP_ORDER.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">Đang tải...</div>
          ) : currentStep === "size" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.size}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate?.size === template.size
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Bowl icon/placeholder */}
                    <div className="w-24 h-24 mb-4 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 rounded-full">
                      <svg className="w-16 h-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <ellipse cx="12" cy="17" rx="9" ry="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 17c0-2.5 4.03-4.5 9-4.5s9 2 9 4.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 13c0-2 4.03-3.5 9-3.5s9 1.5 9 3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name || `Tô ${template.size}`}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {template.max_Carb !== undefined && (
                        <p className="flex items-center justify-center gap-1">
                          <span className="font-medium">Tinh Bột:</span> tối đa {template.max_Carb} phần
                        </p>
                      )}
                      {template.max_Protein !== undefined && (
                        <p className="flex items-center justify-center gap-1">
                          <span className="font-medium">Protein:</span> tối đa {template.max_Protein} phần
                        </p>
                      )}
                      {template.max_Vegetable !== undefined && (
                        <p className="flex items-center justify-center gap-1">
                          <span className="font-medium">Rau:</span> tối đa {template.max_Vegetable} phần
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-orange-600 mt-4">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(BASE_BOWL_PRICE * template.priceRatio))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step info and limit warning */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {STEP_LABELS[currentStep]}
                  </h3>
                  {getMaxLimit() !== null && (
                    <p className="text-sm text-gray-600">
                      Đã chọn: {getCurrentCount()} / {getMaxLimit()} {STEP_LABELS[currentStep].toLowerCase()} (tối đa)
                    </p>
                  )}
                </div>
                {!canAddMore() && (
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                    Đã đạt giới hạn tối đa
                  </div>
                )}
              </div>

              {/* Category selector (if multiple categories) */}
              {categoriesForStep.length > 1 && (
                <div className="relative flex items-center gap-2">
                  {showCatLeftArrow && (
                    <button
                      aria-label="scroll-left"
                      onClick={() => {
                        catScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
                        setTimeout(handleCategoryScroll, 300)
                      }}
                      className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                  )}
                  {!showCatLeftArrow && <div className="w-10 flex-shrink-0" />}
                  <div 
                    ref={catScrollRef} 
                    onScroll={handleCategoryScroll}
                    className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1"
                  >
                    {categoriesForStep.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                          selectedCategoryId === category.id
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category.name}
                        {category.description && (
                          <span className="ml-2 text-xs opacity-75">({category.description})</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {showCatRightArrow && (
                    <button
                      aria-label="scroll-right"
                      onClick={() => {
                        catScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
                        setTimeout(handleCategoryScroll, 300)
                      }}
                      className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  )}
                  {!showCatRightArrow && <div className="w-10 flex-shrink-0" />}
                </div>
              )}

              {/* Ingredients horizontal scroll */}
              {ingredientsForCategory.length > 0 && (
                <div className="relative flex items-center gap-2">
                  {showIngLeftArrow && (
                    <button
                      aria-label="scroll-left"
                      onClick={() => {
                        ingScrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })
                        setTimeout(handleIngredientScroll, 300)
                      }}
                      className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                  )}
                  {!showIngLeftArrow && <div className="w-10 flex-shrink-0" />}
                  <div 
                    ref={ingScrollRef} 
                    onScroll={handleIngredientScroll}
                    className="overflow-x-auto pb-4 scrollbar-hide flex-1"
                  >
                    <div className="flex gap-4" style={{ width: 'max-content' }}>
                      {ingredientsForCategory.map((ingredient) => {
                        const isSelected = selectedIngredients.some(ing => ing.ingredientId === ingredient.id)
                        // Validate: chỉ cho chọn nếu chưa đạt max hoặc đã chọn rồi
                        const currentCount = getSelectedCountByPriority(currentPriority)
                        const maxLimit = getMaxLimit()
                        const canSelect = ((ingredient.available ?? 0) > 0) && (
                          maxLimit === null || 
                          currentCount < maxLimit || 
                          isSelected
                        )
                        const selectedIng = selectedIngredients.find(ing => ing.ingredientId === ingredient.id)
                        const quantityRatio = selectedTemplate?.quantityRatio || 1
                        const stepAmountScaled = normalizeQuantity(getStepAmount(ingredient.unit) * quantityRatio)
                        const maxQuantityByUnitScaled = normalizeQuantity(getMaxQuantityForUnit(ingredient.unit) * quantityRatio)
                        
                        return (
                          <div
                            key={ingredient.id}
                            className={`flex-shrink-0 w-48 p-4 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                              isSelected
                                ? "border-orange-500 bg-orange-50"
                                : canSelect
                                ? "border-gray-200 hover:border-orange-300"
                                : "border-gray-200 opacity-50 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (canSelect) handleIngredientToggle(ingredient)
                            }}
                          >
                            {ingredient.imgUrl ? (
                              <img
                                src={ingredient.imgUrl}
                                alt={ingredient.name}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder-ingredient.png"
                                }}
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Không có ảnh</span>
                              </div>
                            )}
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{ingredient.name}</h4>
                            {/* Chỉ hiển thị giá đơn vị khi chưa chọn */}
                            {!isSelected && ingredient.pricePerUnit !== undefined && (
                              <p className="text-xs text-gray-600 mb-2">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(ingredient.pricePerUnit)}/{formatUnit(ingredient.unit)}
                              </p>
                            )}
                            {isSelected && selectedIng && (
                              <div className="space-y-2 mt-2">
                                {/* Nút điều chỉnh số lượng */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAdjustQuantity(ingredient.id, -1)
                                    }}
                                    className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs"
                                    disabled={selectedIng.quantity <= stepAmountScaled}
                                    title={`Giảm ${formatQuantityDisplay(stepAmountScaled)} ${formatUnit(ingredient.unit)}`}
                                  >
                                    <Minus size={14} className="mr-1" />
                                    <span>{formatQuantityDisplay(stepAmountScaled)}</span>
                                  </button>
                                  <span className="flex-1 text-center text-xs text-gray-700 font-medium">
                                    {formatQuantityDisplay(selectedIng.quantity)} {formatUnit(ingredient.unit)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAdjustQuantity(ingredient.id, 1)
                                    }}
                                    className="flex-shrink-0 px-2 py-1.5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-semibold transition-colors text-xs"
                                    disabled={(() => {
                                      const maxAvailable = ingredient.available ?? Infinity
                                      const maxQuantity = Math.min(maxAvailable, maxQuantityByUnitScaled)
                                      return selectedIng.quantity >= maxQuantity
                                    })()}
                                    title={`Thêm ${formatQuantityDisplay(stepAmountScaled)} ${formatUnit(ingredient.unit)}`}
                                  >
                                    <Plus size={14} className="mr-1" />
                                    <span>{formatQuantityDisplay(stepAmountScaled)}</span>
                                  </button>
                                </div>
                                {/* Hiển thị giá tiền cập nhật */}
                                {ingredient.pricePerUnit && (
                                  <p className="text-xs font-semibold text-orange-600 text-center">
                                    +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Math.round(ingredient.pricePerUnit * selectedIng.quantity))}
                                  </p>
                                )}
                                {/* Hiển thị icon check để báo đã chọn */}
                                <div className="text-orange-500 flex justify-center">
                                  <Check size={14} />
                                </div>
                              </div>
                            )}
                            {!isSelected && canSelect && (
                              <div className="w-full mt-2 px-3 py-1 text-xs font-medium text-orange-600 border border-orange-500 rounded-lg text-center">
                                Nhấn để thêm
                              </div>
                            )}
                            {!isSelected && !canSelect && (ingredient.available ?? 0) > 0 && (
                              <div className="w-full mt-2 px-3 py-1 text-xs font-medium text-yellow-600 border border-yellow-500 rounded-lg text-center bg-yellow-50">
                                Đã đạt giới hạn
                              </div>
                            )}
                            {!isSelected && !canSelect && (ingredient.available ?? 0) <= 0 && (
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
                      aria-label="scroll-right"
                      onClick={() => {
                        ingScrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })
                        setTimeout(handleIngredientScroll, 300)
                      }}
                      className="flex-shrink-0 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 hover:border-orange-500 transition-colors"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  )}
                  {!showIngRightArrow && <div className="w-10 flex-shrink-0" />}
                </div>
              )}
              
              {ingredientsForCategory.length === 0 && categoriesForStep.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  Không có nguyên liệu nào trong danh mục này
                </div>
              )}

              {/* Selected ingredients summary for current step */}
              {(() => {
                const stepIngredients = selectedIngredients.filter(ing => ing.priority === currentPriority)
                if (stepIngredients.length === 0) return null
                
                return (
                  <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {STEP_LABELS[currentStep]} đã chọn ({stepIngredients.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {stepIngredients.map((selected) => {
                        const ingredient = ingredients.find(ing => ing.id === selected.ingredientId)
                        return ingredient ? (
                          <div
                            key={selected.ingredientId}
                            className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            <span>{ingredient.name}</span>
                            <span className="bg-orange-300 px-2 rounded-full text-xs">
                              {formatQuantityDisplay(selected.quantity)}{ingredient.unit ? ` ${formatUnit(ingredient.unit)}` : ""}
                            </span>
                            <button
                              onClick={() => handleIngredientToggle(ingredient)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )
              })()}
              
              {/* All selected ingredients summary */}
              {selectedIngredients.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Tổng cộng: {selectedIngredients.length} nguyên liệu
                  </h4>
                  
                  {/* Hiển thị từng nguyên liệu đã chọn - sắp xếp theo thứ tự priority */}
                  <div className="space-y-2">
                    {[...selectedIngredients]
                      .sort((a, b) => {
                        // Sắp xếp theo priority (Tinh Bột -> Protein -> Rau -> Món kèm)
                        if (a.priority !== b.priority) {
                          return a.priority - b.priority
                        }
                        // Nếu cùng priority, sắp xếp theo tên
                        const ingA = ingredients.find(ing => ing.id === a.ingredientId)
                        const ingB = ingredients.find(ing => ing.id === b.ingredientId)
                        return (ingA?.name || "").localeCompare(ingB?.name || "")
                      })
                      .map((selected) => {
                        const ingredient = ingredients.find(ing => ing.id === selected.ingredientId)
                        if (!ingredient) return null
                        
                        // Xác định loại nguyên liệu từ priority
                        const typeLabel = selected.priority === 1 ? "Tinh Bột" 
                          : selected.priority === 2 ? "Protein"
                          : selected.priority === 3 ? "Rau"
                          : selected.priority === 4 ? "Món kèm"
                          : "Khác"
                        
                        return (
                          <div
                            key={selected.ingredientId}
                            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                                {typeLabel}
                              </span>
                              <span className="text-sm font-medium text-gray-900 truncate">{ingredient.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-semibold text-orange-600 whitespace-nowrap">
                                {formatQuantityDisplay(selected.quantity)}{ingredient.unit ? ` ${formatUnit(ingredient.unit)}` : ""}
                              </span>
                              <button
                                onClick={() => handleIngredientToggle(ingredient)}
                                className="p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                title="Xóa nguyên liệu"
                              >
                                <X size={14} className="text-gray-400 hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  
                  {/* Tóm tắt theo loại */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Tinh Bột:</span> {getSelectedCountByPriority(1)} loại
                      </div>
                      <div>
                        <span className="font-medium">Protein:</span> {getSelectedCountByPriority(2)} loại
                      </div>
                      <div>
                        <span className="font-medium">Rau:</span> {getSelectedCountByPriority(3)} loại
                      </div>
                      <div>
                        <span className="font-medium">Món kèm:</span> {getSelectedCountByPriority(4)} loại
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            {currentStep !== "size" && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Quay lại
              </Button>
            )}
            <div className="text-sm text-gray-600">
              Bước {STEP_ORDER.indexOf(currentStep) + 1} / {STEP_ORDER.length}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Tổng giá</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}
              </p>
            </div>
            {currentStep === "side" ? (
              <Button
                onClick={handleAddToCart}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
                disabled={!selectedTemplate}
              >
                {editingItemId ? "Cập nhật" : "Thêm vào giỏ"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 flex items-center gap-2"
                disabled={!canProceed()}
              >
                Tiếp theo
                <ChevronRight size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

