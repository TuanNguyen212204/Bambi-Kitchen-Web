import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Badge } from "@components/ui/badge"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { DeleteConfirmationModal } from "@components/ui/modal/DeleteConfirmationModal"
import { useIngredientStore } from "@zustand/stores/ingredients"
import { toast } from "sonner"
import { Box, Package, Plus, MoreVertical, Eye, Trash2, Search, TrendingUp, CheckCircle } from "lucide-react"
import type { IngredientCategory } from "@models/category/category"
import type { StoreIngredient } from "@/zustand/types"

export default function AdminIngredientCategoryPage() {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const ingredientStore = useIngredientStore()
  const { 
    categories, 
    fetchCategories, 
    createCategory, 
    updateCategory, 
    removeCategory,
    items: allIngredients,
    fetchAll,
    loading: ingredientsLoading
  } = ingredientStore

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null)
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("")
  
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<number | undefined>(undefined)
  const [priorityInput, setPriorityInput] = useState<string>("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => { 
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchCategories(),
          fetchAll()
        ])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchCategories, fetchAll])

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [categories, searchTerm])

  // Get ingredients for selected category
  const categoryIngredients = useMemo(() => {
    if (!selectedCategory) return []
    
    let filtered = allIngredients.filter((ing) => {
      const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number }).categoryId
        ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
      return catId === selectedCategory.id
    })

    // Filter by search query
    if (ingredientSearchQuery.trim()) {
      const query = ingredientSearchQuery.toLowerCase()
      filtered = filtered.filter(ing => 
        ing.name.toLowerCase().includes(query) ||
        ing.unit?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allIngredients, selectedCategory, ingredientSearchQuery])

  // Stats calculations
  const totalCategories = useMemo(() => categories.length, [categories])
  const totalIngredients = useMemo(() => allIngredients.length, [allIngredients])
  const activeIngredients = useMemo(() => allIngredients.filter(ing => ing.active !== false).length, [allIngredients])
  const categoriesWithIngredients = useMemo(() => {
    return categories.filter(cat => {
      const hasIngredients = allIngredients.some((ing) => {
        const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number }).categoryId
          ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
        return catId === cat.id
      })
      return hasIngredients
    }).length
  }, [categories, allIngredients])

  const statsData = [
    {
      title: "Tổng danh mục",
      value: totalCategories.toString(),
      subtitle: `${categoriesWithIngredients} danh mục có nguyên liệu`,
      icon: Box,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Tổng nguyên liệu",
      value: totalIngredients.toString(),
      subtitle: `${activeIngredients} nguyên liệu đang hoạt động`,
      icon: Package,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Nguyên liệu hoạt động",
      value: activeIngredients.toString(),
      subtitle: `${totalIngredients > 0 ? Math.round((activeIngredients / totalIngredients) * 100) : 0}% tổng nguyên liệu`,
      icon: CheckCircle,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-gray-600",
    },
    {
      title: "Danh mục đã dùng",
      value: categoriesWithIngredients.toString(),
      subtitle: `${totalCategories > 0 ? Math.round((categoriesWithIngredients / totalCategories) * 100) : 0}% tổng danh mục`,
      icon: TrendingUp,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      subtitleColor: "text-green-600",
    },
  ];

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục")
      return
    }
    
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && cat.id !== editingId
    )
    
    if (isDuplicate) {
      toast.error("Tên danh mục đã tồn tại")
      return
    }
    
    // Validate priority: phải trong khoảng 1-4 hoặc undefined
    if (priority !== undefined && (priority < 1 || priority > 4)) {
      toast.error("Độ ưu tiên phải trong khoảng 1-4")
      return
    }
    
    setLoading(true)
    try {
      if (editingId) {
        await updateCategory({ id: editingId, name: name.trim(), description: description.trim() || undefined, priority: priority })
      } else {
        await createCategory({ name: name.trim(), description: description.trim() || undefined, priority: priority })
      }
      setOpen(false)
      setEditingId(null)
      setName("")
      setDescription("")
      setPriority(undefined)
      setPriorityInput("")
      await fetchCategories()
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: IngredientCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description || "")
    setPriority(category.priority)
    setPriorityInput(category.priority !== undefined ? category.priority.toString() : "")
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      if (!ingredientStore.items || ingredientStore.items.length === 0) {
        await ingredientStore.fetchAll?.()
      }
      const hasDependencies = (ingredientStore.items || []).some((ing) => {
        const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number; category?: { id?: number } }).categoryId
          ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
          ?? (ing as unknown as { category?: { id?: number } }).category?.id
        return catId === id
      })
      if (hasDependencies) {
        toast.error("Không thể xóa danh mục vì đang có nguyên liệu sử dụng. Hãy chuyển danh mục cho các nguyên liệu trước.")
        return
      }
    } catch {
      /* no-op */
    }
    setLoading(true)
    try {
      await removeCategory(id)
      setConfirm(null)
      if (selectedCategory?.id === id) {
        setSelectedCategory(null)
      }
      await fetchCategories()
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (category: IngredientCategory) => {
    setSelectedCategory(category)
  }

  const getInitials = (name: string) => {
    if (!name) return "DM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStockStatusBadge = (ingredient: StoreIngredient) => {
    if (ingredient.stockStatus === "out") {
      return <Badge className="bg-red-100 text-red-700 text-xs">Hết hàng</Badge>
    } else if (ingredient.stockStatus === "low") {
      return <Badge className="bg-orange-100 text-orange-700 text-xs">Sắp hết</Badge>
    }
    return <Badge className="bg-green-100 text-green-700 text-xs">Đủ hàng</Badge>
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Danh mục nguyên liệu
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px] mb-4">
                      {stat.title}
                    </div>
                    <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                      {stat.value}
                    </div>
                    <div className={`[font-family:'Inter-Medium',Helvetica] font-medium text-sm leading-[21px] ${stat.subtitleColor}`}>
                      {stat.subtitle}
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Management Section with Two Columns */}
      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">
              Quản lý danh mục nguyên liệu
            </h2>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-auto px-3 py-2"
              onClick={() => { setOpen(true); setEditingId(null); setName(""); setDescription(""); setPriority(undefined); setPriorityInput("") }}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                Thêm danh mục mới
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm leading-[21px]">
                Tìm kiếm danh mục
              </label>
              <Input
                placeholder="Tên, mô tả danh mục..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory(null)
                }}
              >
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-white text-sm">
                  Xóa bộ lọc
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Sidebar (Left) + Content (Right) */}
        <div className="flex">
          {/* Left Sidebar: Categories List */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col" style={{ height: "600px", maxHeight: "calc(100vh - 300px)" }}>
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-4 h-4 text-gray-700" />
                <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm">
                  Danh sách danh mục ({filteredCategories.length})
                </h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategory?.id === category.id;
                    const initials = getInitials(category.name);
                    const numUsing = allIngredients.filter((ing) => {
                      const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number }).categoryId
                        ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
                      return catId === category.id
                    }).length
                    const avatarColor = isSelected ? "bg-green-500" : "bg-blue-500";
                    
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? "border-green-400 bg-green-50" 
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-semibold text-xs">
                              {initials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-xs leading-[18px] mb-1">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                {category.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              {numUsing} nguyên liệu
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="relative">
                              <button
                                className="w-6 h-6 rounded hover:bg-black/10 flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const menu = (e.currentTarget.nextSibling as HTMLElement);
                                  if (menu) menu.classList.toggle('hidden');
                                }}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10 min-w-[120px]">
                                <button
                                  className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(category);
                                  }}
                                >
                                  <Eye className="w-4 h-4" /> Xem chi tiết
                                </button>
                                <button 
                                  className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100 text-sm whitespace-nowrap" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirm({ id: category.id, name: category.name });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" /> Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {searchTerm.trim() ? "Không tìm thấy danh mục" : "Không có danh mục nào"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Ingredients */}
          <div className="flex-1 bg-white flex flex-col" style={{ height: "600px", maxHeight: "calc(100vh - 300px)" }}>
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-gray-700" />
                <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm">
                  Danh sách nguyên liệu
                </h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm nguyên liệu..."
                  className="flex-1 bg-white h-auto py-1.5 text-xs"
                  value={ingredientSearchQuery}
                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {!selectedCategory ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Vui lòng chọn danh mục để xem nguyên liệu</p>
                </div>
              ) : ingredientsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : categoryIngredients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">
                    {ingredientSearchQuery.trim() ? "Không tìm thấy nguyên liệu" : "Danh mục này chưa có nguyên liệu"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryIngredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {ingredient.imgUrl ? (
                          <img 
                            src={ingredient.imgUrl} 
                            alt={ingredient.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {ingredient.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm">
                              {ingredient.name}
                            </h4>
                            {ingredient.active !== false ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">Hoạt động</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 text-xs">Ngừng hoạt động</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                            <span>Đơn vị: {ingredient.unit || "N/A"}</span>
                            {ingredient.stock !== undefined && (
                              <span>Tồn kho: {ingredient.stock}</span>
                            )}
                            {ingredient.pricePerUnit && (
                              <span>Giá: {formatCurrency(ingredient.pricePerUnit)}</span>
                            )}
                          </div>
                          {ingredient.stockStatus && (
                            <div className="flex items-center gap-2">
                              {getStockStatusBadge(ingredient)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ReusableModal 
        open={open} 
        onClose={() => { setOpen(false); setEditingId(null); setName(""); setDescription(""); setPriority(undefined); setPriorityInput("") }} 
        title={editingId ? "Sửa danh mục" : "Thêm danh mục"}
        size="xl"
        contentClassName="sm:max-w-[480px] md:max-w-[640px] lg:max-w-[800px] max-h-[80vh] overflow-y-auto"
      >
        <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Tên danh mục <span className="text-red-500">*</span>
              </Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                disabled={loading}
                className="w-full"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100 ký tự</p>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Mô tả
              </Label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả cho danh mục (tùy chọn)..."
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500 ký tự</p>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Độ ưu tiên (Priority)
              </Label>
              <Input 
                type="number"
                value={priorityInput} 
                onChange={(e) => {
                  const value = e.target.value.trim()
                  setPriorityInput(value)
                  
                  if (value === "") {
                    setPriority(undefined)
                    return
                  }
                  
                  const numValue = parseInt(value, 10)
                  // Chỉ cập nhật priority state nếu giá trị hợp lệ (1-4)
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 4) {
                    setPriority(numValue)
                  } else if (!isNaN(numValue)) {
                    // Nếu nhập số ngoài 1-4, không cập nhật priority state
                    // Nhưng vẫn cho phép nhập trong input để người dùng có thể sửa
                    setPriority(undefined)
                  }
                }}
                onBlur={(e) => {
                  // Khi blur, validate và reset input nếu không hợp lệ
                  const value = e.target.value.trim()
                  if (value === "") {
                    setPriority(undefined)
                    setPriorityInput("")
                    return
                  }
                  
                  const numValue = parseInt(value, 10)
                  if (isNaN(numValue) || numValue < 1 || numValue > 4) {
                    // Reset về giá trị priority hợp lệ (nếu có) hoặc rỗng
                    setPriorityInput(priority !== undefined ? priority.toString() : "")
                    setPriority(undefined)
                    toast.error("Độ ưu tiên phải trong khoảng 1-4 (1: Tinh Bột, 2: Protein, 3: Rau, 4: Món Kèm)")
                  } else {
                    // Đảm bảo input hiển thị đúng giá trị hợp lệ
                    setPriorityInput(numValue.toString())
                    setPriority(numValue)
                  }
                }}
                placeholder="Nhập độ ưu tiên (1-4)..."
                disabled={loading}
                className="w-full"
                min={1}
                max={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                1: Tinh Bột, 2: Protein, 3: Rau, 4: Món Kèm
              </p>
            </div>
          </div>
        </ModalForm>
        <ModalActions 
          onCancel={() => { setOpen(false); setEditingId(null); setName(""); setDescription(""); setPriority(undefined); setPriorityInput("") }} 
          onConfirm={submit}
          confirmText={editingId ? "Lưu thay đổi" : "Tạo danh mục"}
          cancelText="Hủy"
          loading={loading}
        />
      </ReusableModal>

      <DeleteConfirmationModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) {
            try {
              await handleDelete(confirm.id);
              setConfirm(null);
            } catch (error) {
              console.error("Error deleting category:", error);
            }
          }
        }}
        title="Xác nhận xóa danh mục"
        itemName={confirm?.name || 'Không có tên'}
        itemType="danh mục"
      />
    </div>
  )
}
