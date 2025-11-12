import { Card, CardContent } from "@components/ui/card/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { NotificationSection } from "@components/admin/ingredient/NotificationSection";
import AddIngredientModal from "@components/admin/ingredient/AddIngredientModal";
import EditIngredientModal from "@components/admin/ingredient/EditIngredientModal";
import StockHistoryModal from "@components/admin/ingredient/StockHistoryModal";
import { Grid3X3, List, Plus, Search, MoreVertical, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { useIngredientStore } from "@zustand/stores/ingredients";
import { useEffect, useState, useMemo } from "react";
import { Switch } from "@components/ui/switch";
import IngredientDetailModal from "@components/admin/ingredient/IngredientDetailModal";

export const AdminIngredientsPage = () => {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const store = useIngredientStore()
  const { fetchAll, items, categories, fetchCategories, setQuery, setSelectedCategoryId, setStatusFilter, searchByName, selectedCategoryId, statusFilter, loading, filteredItems, viewMode, setViewMode, setSortBy, toggleActive } = store
  const [openAdd, setOpenAdd] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [viewing, setViewing] = useState<null | { id: number; name: string; unit?: string; active?: boolean; imgUrl?: string; stock?: number; quantity?: number; available?: number; reserve?: number; stockStatus?: 'out'|'low'|'normal'; category?: unknown; pricePerUnit?: number }>(null)
  const [editing, setEditing] = useState<null | { id: number; name: string; unit?: string; active?: boolean; category?: unknown; pricePerUnit?: number }>(null)
  const [stockHistory, setStockHistory] = useState<null | { id: number; name: string; unit?: string }>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [imageRefreshKey, setImageRefreshKey] = useState(0)
  const [optimisticActive, setOptimisticActive] = useState<Record<number, { value: boolean; originalValue: boolean }>>({})

  useEffect(() => { 
    fetchAll() 
    fetchCategories()
  }, []) // Chỉ fetch một lần khi component mount
  
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
    setImageRefreshKey(prev => prev + 1)
  }, [items])

  // Đồng bộ optimistic state với store - xóa optimistic state khi store đã update đúng giá trị
  useEffect(() => {
    setOptimisticActive(prev => {
      const newState = { ...prev }
      let hasChanges = false
      
      Object.keys(newState).forEach(idStr => {
        const id = Number(idStr)
        const ingredient = items.find(i => i.id === id)
        const optimistic = newState[id]
        
        // Xóa optimistic state khi store đã update với giá trị mới (khác với giá trị ban đầu)
        if (ingredient && optimistic && ingredient.active !== optimistic.originalValue) {
          delete newState[id]
          hasChanges = true
        }
      })
      
      return hasChanges ? newState : prev
    })
  }, [items])

  // Đồng bộ viewing state với items để modal detail hiển thị dữ liệu mới nhất
  useEffect(() => {
    if (viewing?.id) {
      const updatedIngredient = items.find(i => i.id === viewing.id)
      if (updatedIngredient) {
        setViewing({
          id: updatedIngredient.id,
          name: updatedIngredient.name,
          unit: updatedIngredient.unit,
          active: updatedIngredient.active,
          imgUrl: updatedIngredient.imgUrl,
          stock: updatedIngredient.stock,
          quantity: updatedIngredient.quantity,
          available: updatedIngredient.available,
          reserve: updatedIngredient.reserve,
          stockStatus: updatedIngredient.stockStatus,
          category: updatedIngredient.category,
          pricePerUnit: updatedIngredient.pricePerUnit,
        })
      }
    }
  }, [items, viewing?.id])
  
  const getIngredientKey = useMemo(() => {
    return (ingredient: { id: number; imgUrl?: string }) => `${ingredient.id}-${ingredient.imgUrl}-${refreshKey}`
  }, [refreshKey])

  const total = items.length
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const parseCreatedDate = (value?: unknown): Date | undefined => {
    if (!value) return undefined
    const s = String(value)
    const d1 = new Date(s)
    if (!isNaN(d1.getTime())) return d1
    const d2 = new Date(s.replace(' ', 'T'))
    if (!isNaN(d2.getTime())) return d2
    return undefined
  }
  const sessionCreatedIds = (store as unknown as { sessionCreatedIds?: number[] }).sessionCreatedIds || []
  const newThisWeek = items.filter((i: { id: number; created_at?: unknown; createdAt?: unknown; createAt?: unknown; updated_at?: unknown; updatedAt?: unknown }) => {
    const createdRaw = i?.created_at ?? i?.createdAt ?? (i as { createAt?: unknown }).createAt ?? i?.updated_at ?? i?.updatedAt
    const d = parseCreatedDate(createdRaw)
    if (d) return d >= sevenDaysAgo && d <= now
    return sessionCreatedIds.includes(i.id)
  }).length
  const activeCount = items.filter((i: { active?: boolean }) => i.active ?? true).length
  const lowCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'low').length
  const outCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'out').length

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Thành phần
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>
      </section>

      <NotificationSection />

      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">Quản lý Nguyên liệu</h2>
            <div className="flex gap-2">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white h-auto px-3 py-2 text-sm" onClick={()=> setOpenAdd(true)}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="[font-family:'Arial-Narrow',Helvetica] text-sm">Thêm nguyên liệu mới</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Tìm kiếm nguyên liệu</Label>
              <Input
                placeholder="Tên nguyên liệu..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={keyword}
                onChange={(e)=> { setKeyword(e.target.value); setQuery(e.target.value) }}
              />
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Danh mục</Label>
              <Select value={selectedCategoryId ? String(selectedCategoryId) : 'all'} onValueChange={(val)=> setSelectedCategoryId(val === 'all' ? undefined : Number(val))}>
                <SelectTrigger className="bg-white h-auto py-2 text-sm">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Trạng thái</Label>
              <Select value={statusFilter || 'all'} onValueChange={(val)=> setStatusFilter((val as 'all'|'active'|'inactive') || 'all')}>
                <SelectTrigger className="bg-white h-auto py-2 text-sm">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Tìm kiếm</Label>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2 text-sm"
                onClick={()=> {
                  const kw = keyword.trim()
                  if (kw) searchByName(kw); else fetchAll()
                }}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">Danh sách Nguyên liệu ({filteredItems().length} loại)</h3>
            <div className="flex gap-2">
              <Button className={`h-auto ${viewMode==='grid'?'bg-orange-600 text-white':'bg-white text-black'} hover:bg-orange-700 border border-solid px-3 py-1 text-sm`} size="sm" onClick={()=> setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4 mr-1" />
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">Grid</span>
              </Button>
              <Button variant="outline" className={`h-auto ${viewMode==='list'?'bg-orange-600 text-white':'bg-white text-black'} border-gray-300 px-3 py-1 text-sm`} size="sm" onClick={()=> { setViewMode('list'); setSortBy('priority') }}>
                <List className="w-4 h-4 mr-1" />
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">List</span>
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'grid grid-cols-1 gap-3'}>
            {filteredItems().map((ingredient: { id: number; name: string; unit?: string; active?: boolean; category?: unknown; stock?: number; stockStatus?: 'out'|'low'|'normal'; imgUrl?: string; publicId?: string; pricePerUnit?: number }) => (
              <Card key={getIngredientKey(ingredient)} className={`bg-white border-2 border-gray-200`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        {ingredient.imgUrl ? (
                          <img 
                            key={`img-${ingredient.id}-${ingredient.imgUrl}-${imageRefreshKey}`}
                            src={ingredient.imgUrl || ''} 
                            alt={ingredient.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            loading="eager"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              target.onerror = null
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${ingredient.stockStatus === 'out' ? 'bg-red-500' : ingredient.stockStatus === 'low' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px] truncate">{ingredient.name}</h3>
                        {ingredient.unit && (
                          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[16px] opacity-75">{ingredient.unit}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-center">
                      <div className="flex items-center gap-1.5 flex-shrink-0" title={(optimisticActive[ingredient.id] !== undefined ? optimisticActive[ingredient.id].value : (ingredient.active ?? true)) ? "Đang hoạt động - Có thể sử dụng" : "Đang tắt - Không thể sử dụng"}>
                        {(optimisticActive[ingredient.id] !== undefined ? optimisticActive[ingredient.id].value : (ingredient.active ?? true)) ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <Switch
                          checked={optimisticActive[ingredient.id] !== undefined ? optimisticActive[ingredient.id].value : (ingredient.active ?? true)}
                          onCheckedChange={async (checked) => {
                            const originalValue = ingredient.active ?? true
                            
                            // Nếu đang filter theo active/inactive và toggle sẽ làm nguyên liệu biến mất, reset filter về "all"
                            if (statusFilter === "active" && !checked) {
                              setStatusFilter("all")
                            } else if (statusFilter === "inactive" && checked) {
                              setStatusFilter("all")
                            }
                            
                            // Optimistic update - cập nhật ngay để animation hoạt động
                            setOptimisticActive(prev => ({ 
                              ...prev, 
                              [ingredient.id]: { value: checked, originalValue }
                            }))
                            
                            try {
                              await toggleActive(ingredient.id, checked)
                              // Optimistic state sẽ tự động được xóa bởi useEffect khi store update
                            } catch (error) {
                              // Revert nếu API thất bại
                              setOptimisticActive(prev => {
                                const newState = { ...prev }
                                delete newState[ingredient.id]
                                return newState
                              })
                              console.error("Error toggling active:", error)
                            }
                          }}
                          className="flex-shrink-0"
                        />
                      </div>
                      <button 
                        className="w-8 h-8 rounded hover:bg-black/10 flex items-center justify-center flex-shrink-0 transition-colors self-center" 
                        onClick={() => {
                          const ing = ingredient as typeof ingredient & { quantity?: number; available?: number; reserve?: number }
                          setViewing({
                            id: ing.id, 
                            name: ing.name,
                            unit: ing.unit,
                            imgUrl: ing.imgUrl,
                            active: ing.active,
                            stock: ing.stock,
                            quantity: ing.quantity,
                            available: ing.available,
                            reserve: ing.reserve,
                            stockStatus: ing.stockStatus,
                            category: ing.category,
                            pricePerUnit: ing.pricePerUnit
                          })
                        }}
                        title="Xem chi tiết"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700">Tồn kho hiện tại</span>
                      <span className="text-sm text-gray-700">{ingredient.stock ?? '—'}</span>
                    </div>
                    <div className="w-full bg-[#00000033] rounded-full h-2 overflow-hidden">
                      {typeof ingredient.stock === 'number' && (
                        <div className={`${ingredient.stockStatus === 'out' ? 'bg-red-700' : ingredient.stockStatus === 'low' ? 'bg-amber-700' : 'bg-emerald-700'} h-full rounded-full`} style={{ width: `${Math.max(0, Math.min(100, (ingredient.stock / 20) * 100))}%` }} />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      className="h-auto bg-blue-100 hover:bg-blue-200 px-3 py-1 text-blue-700"
                      onClick={() => setStockHistory(ingredient)}
                    >
                      <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-xs text-center">Lịch sử tồn kho</span>
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))}
            {loading && (
              <div className="col-span-full flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {viewing && (
        <IngredientDetailModal 
          open={true} 
          onClose={()=> setViewing(null)} 
          ingredient={viewing}
        />
      )}
      {editing && (
        <EditIngredientModal 
          open={true} 
          onClose={()=> setEditing(null)} 
          ingredient={((): { id: number; name: string; unit?: string; active?: boolean; ingredient_category_id?: number; categoryId?: number; category?: { id: number } | null; imgUrl?: string; pricePerUnit?: number } => {
            const maybeAny = editing as unknown as { ingredient_category_id?: number; categoryId?: number; category?: { id?: number } | null; imgUrl?: string; pricePerUnit?: number }
            const mappedCategory = (maybeAny.category && typeof maybeAny.category === 'object' && typeof maybeAny.category.id === 'number')
              ? { id: maybeAny.category.id }
              : null
            return {
              id: editing.id,
              name: editing.name,
              unit: editing.unit,
              active: editing.active,
              ingredient_category_id: typeof maybeAny.categoryId === 'number' ? maybeAny.categoryId : (typeof maybeAny.ingredient_category_id === 'number' ? maybeAny.ingredient_category_id : undefined),
              categoryId: typeof maybeAny.categoryId === 'number' ? maybeAny.categoryId : undefined,
              category: mappedCategory ?? null,
              imgUrl: typeof maybeAny.imgUrl === 'string' ? maybeAny.imgUrl : undefined,
              pricePerUnit: typeof maybeAny.pricePerUnit === 'number' ? maybeAny.pricePerUnit : (editing.pricePerUnit ?? undefined),
            }
          })()}
        />
      )}
      {stockHistory && (
        <StockHistoryModal open={true} onClose={()=> setStockHistory(null)} ingredient={stockHistory} />
      )}
      <AddIngredientModal open={openAdd} onClose={()=> setOpenAdd(false)} />
      {/* Xóa hộp thoại xác nhận toggle/xóa: BE không còn xoá, toggle nằm trong Edit */}
    </div>
  );
};

export default AdminIngredientsPage;