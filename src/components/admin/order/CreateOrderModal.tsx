import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import { bambiApi, API_ENDPOINTS } from "@utils/api"
import { Search, Plus, X, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import PresetDishModal from "@/components/customer/menu/PresetDishModal"
import CustomBowlModal from "@/components/customer/menu/CustomBowlModal"
import { useDishStore } from "@/zustand/stores/dish"
import type { DishItem } from "@/zustand/slices/dish/list.slice"
import type { Dish } from "@models/dish/dish"
import type { DishTemplateItem } from "@/zustand/slices/dish/template.slice"

type OrderItem = {
  id: number
  dish: Dish
  quantity: number
  notes?: string
  type: "preset" | "custom" | "preset-modified"
}

interface Props {
  open: boolean
  onOpenChange?: (v: boolean) => void
  onClose?: () => void
  onCreated?: () => void
  initialAccountId?: number
}

export default function CreateOrderModal(props: Props) {
  const { open, onOpenChange, onClose, onCreated, initialAccountId } = props
  
  const { items: dishes, fetchAll: fetchDishes, fetchTemplates } = useDishStore()
  
  const [accountId, setAccountId] = useState<number | undefined>(initialAccountId)
  const [note, setNote] = useState("")
  const [q, setQ] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<Array<{ id: number; name?: string; mail?: string; role?: string }>>([])
  const [accountSearch, setAccountSearch] = useState("")
  
  // Modal states
  const [presetModalOpen, setPresetModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [presetInitialData, setPresetInitialData] = useState<{
    size: "S" | "M" | "L"
    recipeModifications: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }>
    quantity: number
  } | null>(null)
  const [customInitialData, setCustomInitialData] = useState<{
    template: DishTemplateItem
    selectedIngredients: Array<{ ingredientId: number; quantity: number; categoryId: number; priority: number }>
  } | null>(null)

  // Fetch data khi mở modal
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const [aRes] = await Promise.all([
          bambiApi.get<Array<{ id: number; name?: string; mail?: string; role?: string }>>(API_ENDPOINTS.API_ACCOUNTS),
          fetchDishes("menu"), // Chỉ lấy dishes public và active
        ])
        setAccounts((aRes.data || []).filter((x) => String(x.role).toUpperCase() === 'USER'))
        await fetchTemplates()
      } catch (err) {
        console.error("Error fetching data:", err)
        toast.error("Không thể tải dữ liệu")
      }
    })()
  }, [open, fetchDishes, fetchTemplates])

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setOrderItems([])
      setAccountId(initialAccountId)
      setNote("")
      setQ("")
      setAccountSearch("")
      setPresetModalOpen(false)
      setCustomModalOpen(false)
      setSelectedDish(null)
      setEditingItemId(null)
      setPresetInitialData(null)
      setCustomInitialData(null)
    }
  }, [open, initialAccountId])

  const filteredDishes = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return dishes
    return dishes.filter((d) => `${d.id} ${d.name ?? ""}`.toLowerCase().includes(term))
  }, [q, dishes])

  // Tính tổng giá
  const totalPrice = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)
  }, [orderItems])

  // Mở modal preset dish
  const handleOpenPresetModal = (dish: DishItem) => {
    // Đóng custom modal nếu đang mở
    if (customModalOpen) {
      setCustomModalOpen(false)
      setCustomInitialData(null)
    }
    setSelectedDish(dish)
    setPresetInitialData({
      size: "M",
      recipeModifications: [],
      quantity: 1,
    })
    setPresetModalOpen(true)
  }

  // Mở modal custom bowl
  const handleOpenCustomModal = () => {
    // Đóng preset modal nếu đang mở
    if (presetModalOpen) {
      setPresetModalOpen(false)
      setSelectedDish(null)
      setPresetInitialData(null)
    }
    setCustomInitialData(null)
    setCustomModalOpen(true)
  }

  // Xử lý khi thêm preset dish
  const handleAddPresetDish = (dish: Dish, quantity: number, notes?: string) => {
    const newItem: OrderItem = {
      id: Date.now(),
      dish,
      quantity,
      notes,
      type: notes ? "preset-modified" : "preset",
    }
    setOrderItems(prev => [...prev, newItem])
    setPresetModalOpen(false)
    setSelectedDish(null)
    setPresetInitialData(null)
    toast.success("Đã thêm món vào đơn hàng")
  }

  // Xử lý khi thêm custom bowl
  const handleAddCustomBowl = (dish: Dish, quantity: number, notes?: string) => {
    const newItem: OrderItem = {
      id: Date.now(),
      dish,
      quantity,
      notes,
      type: "custom",
    }
    setOrderItems(prev => [...prev, newItem])
    setCustomModalOpen(false)
    setCustomInitialData(null)
    toast.success("Đã thêm món vào đơn hàng")
  }

  // Xử lý khi chỉnh sửa item
  const handleEditItem = (itemId: number) => {
    const item = orderItems.find(i => i.id === itemId)
    if (!item) return

    setEditingItemId(itemId)

    // Parse notes để xác định loại món
    let parsedData: {
      basedOnId?: number
      dishTemplate?: { size: "S" | "M" | "L" }
      template?: DishTemplateItem & { size: "S" | "M" | "L" }
      recipe?: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }>
      quantity?: number
    } | null = null

    if (item.notes) {
      try {
        parsedData = JSON.parse(item.notes)
      } catch {
        // Nếu không parse được, coi như preset không tùy chỉnh
      }
    }

    // Custom Bowl: có template, không có basedOnId
    if (parsedData?.template && !parsedData.basedOnId) {
      // Đóng preset modal nếu đang mở
      if (presetModalOpen) {
        setPresetModalOpen(false)
        setSelectedDish(null)
        setPresetInitialData(null)
      }
      setCustomInitialData({
        template: parsedData.template as DishTemplateItem,
        selectedIngredients: (parsedData.recipe || []).map(rec => ({
          ingredientId: rec.ingredientId,
          quantity: rec.quantity,
          categoryId: 0, // Will be set in modal
          priority: 0, // Will be set in modal
        })),
      })
      setCustomModalOpen(true)
    }
    // Preset Dish: có basedOnId hoặc không có parsedData
    else {
      // Đóng custom modal nếu đang mở
      if (customModalOpen) {
        setCustomModalOpen(false)
        setCustomInitialData(null)
      }
      // Convert Dish thành DishItem
      const dishItem: DishItem = {
        id: item.dish.id,
        name: item.dish.name,
        price: item.dish.price,
        imageUrl: item.dish.img_url || item.dish.imgUrl,
        description: item.dish.description,
        public: item.dish.is_public,
        active: true,
        usedQuantity: item.dish.used,
        categoryId: item.dish.dish_category_id,
      }
      setSelectedDish(dishItem)

      // Nếu có parsedData, khôi phục state
      if (parsedData) {
        setPresetInitialData({
          size: parsedData.dishTemplate?.size || "M",
          recipeModifications: parsedData.recipe || [],
          quantity: parsedData.quantity || item.quantity,
        })
      } else {
        // Preset không tùy chỉnh
        setPresetInitialData({
          size: "M",
          recipeModifications: [],
          quantity: item.quantity,
        })
      }
      setPresetModalOpen(true)
    }
  }

  // Xử lý khi save preset dish (edit)
  const handleSavePresetDish = (dish: Dish, quantity: number, notes: string) => {
    if (editingItemId === null) {
      handleAddPresetDish(dish, quantity, notes)
      return
    }

    setOrderItems(prev => prev.map(item => 
      item.id === editingItemId 
        ? { ...item, dish, quantity, notes, type: notes ? "preset-modified" : "preset" }
        : item
    ))
    setPresetModalOpen(false)
    setEditingItemId(null)
    setSelectedDish(null)
    setPresetInitialData(null)
    toast.success("Đã cập nhật món ăn")
  }

  // Xử lý khi save custom bowl (edit)
  const handleSaveCustomBowl = (dish: Dish, quantity: number, notes: string) => {
    if (editingItemId === null) {
      handleAddCustomBowl(dish, quantity, notes)
      return
    }

    setOrderItems(prev => prev.map(item => 
      item.id === editingItemId 
        ? { ...item, dish, quantity, notes, type: "custom" }
        : item
    ))
    setCustomModalOpen(false)
    setEditingItemId(null)
    setCustomInitialData(null)
    toast.success("Đã cập nhật món ăn")
  }

  // Xóa item
  const handleRemoveItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId))
    toast.success("Đã xóa món khỏi đơn hàng")
  }

  // Parse order item để tạo order request
  const parseOrderItemToRequest = (item: OrderItem): any => {
    let parsedData: {
      basedOnId?: number
      dishTemplate?: { size: "S" | "M" | "L" }
      template?: { size: "S" | "M" | "L" }
      recipe?: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }>
      quantity?: number
    } | null = null

    if (item.notes) {
      try {
        parsedData = JSON.parse(item.notes)
      } catch {
        // Nếu không parse được, coi như preset không tùy chỉnh
      }
    }

    const orderItem: any = {
      name: item.dish.name,
      quantity: item.quantity,
    }

    // Nếu có parsedData (từ preset dish customization hoặc custom bowl)
    if (parsedData) {
      // Custom Bowl: có template, không có basedOnId, recipe chỉ có ADDON
      if (parsedData.template && !parsedData.basedOnId) {
        // Custom Dish - không có dishId hoặc basedOnId
        orderItem.dishTemplate = { size: parsedData.template.size }
        if (parsedData.recipe && Array.isArray(parsedData.recipe)) {
          orderItem.recipe = parsedData.recipe.map(r => ({
            ingredientId: r.ingredientId,
            quantity: Math.round(r.quantity),
            sourceType: r.sourceType,
          }))
        } else {
          orderItem.recipe = []
        }
      }
      // Preset Dish có tùy chỉnh: có basedOnId, có recipe (REMOVED/ADDON)
      else if (parsedData.basedOnId) {
        orderItem.basedOnId = parsedData.basedOnId
        if (parsedData.dishTemplate) {
          orderItem.dishTemplate = parsedData.dishTemplate
        }
        if (parsedData.recipe && Array.isArray(parsedData.recipe)) {
          orderItem.recipe = parsedData.recipe.map(r => ({
            ingredientId: r.ingredientId,
            quantity: Math.round(r.quantity),
            sourceType: r.sourceType,
          }))
        } else {
          orderItem.recipe = []
        }
      }
      // Trường hợp: có dishTemplate nhưng không có basedOnId và không có template
      // Đây là preset không tùy chỉnh nhưng size khác M
      else if (parsedData.dishTemplate && !parsedData.template) {
        // Preset không tùy chỉnh nhưng size khác M: dùng dishId
        orderItem.dishId = item.dish.id
        orderItem.dishTemplate = parsedData.dishTemplate
        orderItem.recipe = parsedData.recipe && Array.isArray(parsedData.recipe) 
          ? parsedData.recipe.map(r => ({
              ingredientId: r.ingredientId,
              quantity: Math.round(r.quantity),
              sourceType: r.sourceType,
            }))
          : []
      }
    } else {
      // Nếu không có customization, dùng dishId trực tiếp
      // Dish Preset (không tùy chỉnh, size M mặc định)
      orderItem.dishId = item.dish.id
      orderItem.dishTemplate = { size: "M" } // Mặc định size M
      orderItem.recipe = []
    }

    return orderItem
  }

  // Xử lý thanh toán tại quầy
  const handleCheckout = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn khách hàng")
      return
    }

    if (orderItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một món vào đơn hàng")
      return
    }

    setSubmitting(true)
    try {
      // Parse order items và fetch recipe cho món preset không tùy chỉnh
      const orderItemsRequest = await Promise.all(
        orderItems.map(async (item) => {
          const parsed = parseOrderItemToRequest(item)
          
          // Nếu là preset không tùy chỉnh (có dishId, không có basedOnId, recipe rỗng)
          // Cần fetch recipe từ API
          if (parsed.dishId && !parsed.basedOnId && (!parsed.recipe || parsed.recipe.length === 0)) {
            try {
              const recipeRes = await bambiApi.get(API_ENDPOINTS.API_RECIPE_BY_DISH(item.dish.id))
              let recipe: Array<{ ingredientId: number; quantity: number; sourceType: "REMOVED" | "ADDON" }> = []
              
              // Parse recipe response
              if (Array.isArray(recipeRes.data)) {
                recipe = recipeRes.data
                  .filter((r: any) => r.ingredient?.id && typeof r.quantity === 'number')
                  .map((r: any) => ({
                    ingredientId: r.ingredient.id,
                    quantity: Math.round(r.quantity),
                    sourceType: "ADDON" as const, // Recipe mặc định là ADDON
                  }))
              } else if (recipeRes.data && typeof recipeRes.data === 'object' && 'ingredients' in recipeRes.data) {
                const responseData = recipeRes.data as {
                  ingredients?: Array<{
                    id: number
                    neededQuantity?: number
                  }>
                }
                recipe = (responseData.ingredients || [])
                  .filter(ing => ing.id && typeof ing.neededQuantity === 'number')
                  .map(ing => ({
                    ingredientId: ing.id,
                    quantity: Math.round(ing.neededQuantity!),
                    sourceType: "ADDON" as const,
                  }))
              }
              
              parsed.recipe = recipe
            } catch (error) {
              console.error(`Error fetching recipe for dish ${item.dish.id}:`, error)
              // Nếu không fetch được, để recipe rỗng
              parsed.recipe = []
            }
          }
          
          return parsed
        })
      )

      const orderRequest = {
        accountId,
        paymentMethod: "CASH",
        note: note.trim() || undefined,
        totalPrice,
        items: orderItemsRequest,
      }

      const response = await bambiApi.post<string>(API_ENDPOINTS.API_ORDERS, orderRequest)

      // Nếu response là "Pay with Cash on Delivery", hiển thị thông báo thành công
      if (typeof response.data === "string") {
        if (response.data === "Pay with Cash on Delivery" || response.data.includes("Cash on Delivery")) {
          toast.success("Thanh toán tại quầy thành công!", {
            description: "Đơn hàng đã được tạo và thanh toán thành công",
          })
          onCreated?.()
          onOpenChange?.(false)
          onClose?.()
          return
        }
        // Nếu là URL (payment gateway), không nên xảy ra với CASH
        if (response.data.startsWith("http")) {
          toast.warning("Phát hiện URL thanh toán, nhưng phương thức là CASH")
        }
      }

      // Fallback: coi như thành công
      toast.success("Đơn hàng đã được tạo thành công")
      onCreated?.()
      onOpenChange?.(false)
      onClose?.()
    } catch (error: unknown) {
      console.error("Error creating order:", error)
      const errorMessage = 
        (error && typeof error === "object" && "response" in error && 
         error.response && typeof error.response === "object" && "data" in error.response &&
         error.response.data && typeof error.response.data === "object" && "message" in error.response.data &&
         typeof error.response.data.message === "string") 
          ? error.response.data.message
          : (error && typeof error === "object" && "message" in error && typeof error.message === "string")
          ? error.message
          : "Tạo đơn hàng thất bại"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(v) => { 
          // Không đóng modal tạo đơn nếu modal con đang mở
          if (!v && (presetModalOpen || customModalOpen)) {
            return
          }
          onOpenChange?.(v)
          if (!v) onClose?.()
        }}
      >
        <DialogPortal>
          <DialogOverlay 
            className={cn("!z-[50]", (presetModalOpen || customModalOpen) && "pointer-events-none")} 
            style={(presetModalOpen || customModalOpen) ? { pointerEvents: 'none' } : undefined}
            onClick={(e) => {
              // Ngăn overlay đóng modal khi modal con đang mở
              if (presetModalOpen || customModalOpen) {
                e.stopPropagation()
                e.preventDefault()
              }
            }}
            onWheel={(e) => {
              // Cho phép scroll events pass through khi modal con mở
              if (presetModalOpen || customModalOpen) {
                e.stopPropagation()
              }
            }}
            onTouchMove={(e) => {
              // Cho phép touch scroll events pass through khi modal con mở
              if (presetModalOpen || customModalOpen) {
                e.stopPropagation()
              }
            }}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[50] m-0 mt-0 grid w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
          >
            <DialogHeader>
              <DialogTitle>Tạo đơn hàng tại quầy</DialogTitle>
            </DialogHeader>
          
          <div className="space-y-4">
            {/* Thông tin khách hàng và ghi chú */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Khách hàng</label>
                <div className="relative">
                  <Input 
                    value={accountSearch} 
                    onChange={(e) => setAccountSearch(e.target.value)} 
                    placeholder="Tìm khách hàng theo tên/email" 
                    className="bg-white mb-2" 
                  />
                  <Select 
                    value={typeof accountId === 'number' ? String(accountId) : undefined} 
                    onValueChange={(v) => setAccountId(Number(v))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(a => { 
                          const t = accountSearch.trim().toLowerCase()
                          return !t || `${a.name ?? ''} ${a.mail ?? ''}`.toLowerCase().includes(t) 
                        })
                        .slice(0, 50)
                        .map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name || a.mail || `User #${a.id}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Ghi chú</label>
                <Input 
                  className="bg-white" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Ghi chú đơn hàng" 
                />
              </div>
            </div>

            {/* Tabs: Custom Bowl và Preset Dish */}
            <Tabs defaultValue="preset" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Món có sẵn</TabsTrigger>
                <TabsTrigger value="custom">Tô tùy chỉnh</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preset" className="space-y-4">
                <div className="p-3 border border-gray-200 rounded-md bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-800">Danh sách món (Menu)</div>
                    <div className="relative w-56">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input 
                        value={q} 
                        onChange={(e) => setQ(e.target.value)} 
                        placeholder="Tìm món..." 
                        className="pl-8 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {filteredDishes.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">Không có món nào</div>
                    ) : (
                      filteredDishes.map(d => (
                        <div 
                          key={d.id} 
                          className="p-2 border border-gray-200 rounded-md flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{d.name || `Món #${d.id}`}</div>
                            <div className="text-xs text-gray-600">
                              Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.price || 0)}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenPresetModal(d)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="p-3 border border-gray-200 rounded-md bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-800">Tạo tô tùy chỉnh</div>
                    <Button 
                      onClick={handleOpenCustomModal}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tạo tô mới
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Tạo tô tùy chỉnh với các nguyên liệu bạn muốn. Bạn có thể chọn tinh bột, protein, rau và món kèm.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Danh sách món đã chọn */}
            <div className="p-3 border border-gray-200 rounded-md bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Món đã chọn ({orderItems.length})
                </div>
                {orderItems.length > 0 && (
                  <div className="text-sm font-semibold text-orange-600">
                    Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                  </div>
                )}
              </div>
              
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
                  Chưa có món nào trong đơn hàng
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orderItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3 border border-gray-100 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">{item.dish.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              {item.type === "custom" ? "Custom" : item.type === "preset-modified" ? "Preset (đã chỉnh)" : "Preset"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            Số lượng: {item.quantity} • Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.dish.price * item.quantity)}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-gray-500 italic">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(item.notes)
                                  if (parsed.template) return "Tô tùy chỉnh"
                                  if (parsed.basedOnId) return "Món preset đã chỉnh sửa"
                                  return "Có ghi chú"
                                } catch {
                                  return item.notes
                                }
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer với nút thanh toán */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange?.(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleCheckout} 
                disabled={submitting || accountId === undefined || accountId === null || orderItems.length === 0} 
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={accountId === undefined || accountId === null ? "Vui lòng chọn khách hàng" : orderItems.length === 0 ? "Vui lòng thêm ít nhất một món" : ""}
              >
                {submitting ? 'Đang xử lý...' : `Thanh toán tại quầy (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)})`}
              </Button>
            </div>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Preset Dish Modal */}
      <PresetDishModal
        open={presetModalOpen}
        onClose={() => {
          setPresetModalOpen(false)
          setEditingItemId(null)
          setSelectedDish(null)
          setPresetInitialData(null)
        }}
        dish={selectedDish}
        editingItemId={editingItemId}
        initialData={presetInitialData}
        onSave={handleSavePresetDish}
      />

      {/* Custom Bowl Modal */}
      <CustomBowlModal
        open={customModalOpen}
        onClose={() => {
          setCustomModalOpen(false)
          setEditingItemId(null)
          setCustomInitialData(null)
        }}
        editingItemId={editingItemId}
        initialData={customInitialData}
        onSave={handleSaveCustomBowl}
      />
    </>
  )
}
