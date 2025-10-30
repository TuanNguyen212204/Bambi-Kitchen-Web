import { Card, CardContent } from "@components/ui/card/card";
import { Badge } from "@components/ui/badge/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { NotificationSection } from "@components/admin/ingredient/NotificationSection";
import AddIngredientModal from "@components/admin/ingredient/AddIngredientModal";
import EditIngredientModal from "@components/admin/ingredient/EditIngredientModal";
import StockHistoryModal from "@components/admin/ingredient/StockHistoryModal";
import { Grid3X3, List, Plus, Search, MoreVertical, Edit3, Image as ImageIcon } from "lucide-react";
import { useIngredientStore } from "@zustand/stores/ingredients";
import { useEffect, useState, useMemo } from "react";

export const AdminIngredientsPage = () => {
  const currentDate = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const store = useIngredientStore()
  const { fetchAll, items, categories, fetchCategories, setQuery, setSelectedCategoryId, setStatusFilter, searchByName, selectedCategoryId, statusFilter, loading, filteredItems, viewMode, setViewMode, setSortBy } = store
  const [openAdd, setOpenAdd] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [editing, setEditing] = useState<null | { id: number; name: string; unit?: string; active?: boolean; category?: unknown }>(null)
  const [stockHistory, setStockHistory] = useState<null | { id: number; name: string; unit?: string }>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [imageRefreshKey, setImageRefreshKey] = useState(0)

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchCategories() }, [fetchCategories])
  
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
    setImageRefreshKey(prev => prev + 1)
  }, [items])
  
  const getIngredientKey = useMemo(() => {
    return (ingredient: { id: number; imgUrl?: string }) => `${ingredient.id}-${ingredient.imgUrl}-${refreshKey}`
  }, [refreshKey])

  const total = items.length
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newThisWeek = items.filter((i: { created_at?: string; createdAt?: string }) => {
    const created = i?.created_at || i?.createdAt
    if (!created) return false
    const d = new Date(created)
    return !isNaN(d.getTime()) && d >= sevenDaysAgo && d <= now
  }).length
  const activeCount = items.filter((i: { active?: boolean }) => i.active ?? true).length
  const lowCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'low').length
  const outCount = items.filter((i: { stockStatus?: string }) => i.stockStatus === 'out').length

  const metricCards = [
    {
      title: "Tổng nguyên liệu",
      value: String(total),
      subtitle: total > 0 ? `+${newThisWeek} loại mới tuần này` : "",
      icon: "📦",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Đang hoạt động",
      value: String(activeCount),
      subtitle: total ? `${((activeCount / total) * 100).toFixed(1)}% đang sử dụng` : "0%",
      icon: "✅",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      subtitleColor: "text-green-600",
    },
    {
      title: "Sắp hết hàng",
      value: String(lowCount),
      subtitle: lowCount > 0 ? "Cần bổ sung ngay" : "",
      icon: "!",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      subtitleColor: "text-red-500",
    },
    {
      title: "Hết hàng",
      value: String(outCount),
      subtitle: outCount > 0 ? "Cần nhập khẩn cấp" : "",
      icon: "🚫",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      subtitleColor: "text-red-500",
    },
  ]

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <Card key={index} className="border border-solid shadow-[0px_1px_3px_#0000001a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-500 text-sm leading-[21px] mb-4">
                      {card.title}
                    </div>
                    <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[32px] leading-[48px] mb-2">
                      {card.value}
                    </div>
                    <div className={`[font-family:'Inter-Medium',Helvetica] font-medium text-sm leading-[21px] ${card.subtitleColor}`}>
                      {card.subtitle}
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className={`text-xl ${card.iconColor}`}>{card.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                placeholder="Tên nguyên liệu, nhà cung cấp..."
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
            {filteredItems().map((ingredient: { id: number; name: string; unit?: string; active?: boolean; category?: unknown; stock?: number; stockStatus?: 'out'|'low'|'normal'; imgUrl?: string; publicId?: string }) => (
              <Card key={getIngredientKey(ingredient)} className={`bg-white border-2 border-gray-200`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
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
                      <div>
                        <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px]">{ingredient.name}</h3>
                        <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[16px] opacity-75">{ingredient.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ingredient.active === false ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                        {ingredient.active === false ? "Đang tắt" : "Đang bật"}
                      </Badge>
                      <div className="relative">
                        <button className="w-8 h-8 rounded hover:bg-black/10 flex items-center justify-center" onClick={(e)=>{
                          const menu = (e.currentTarget.nextSibling as HTMLElement)
                          if (menu) menu.classList.toggle('hidden')
                        }}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10">
                          <button className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100" onClick={()=> setEditing(ingredient)}>
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                        </div>
                      </div>
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

                  <div className="bg-[#0000001a] rounded-md p-3 space-y-2">
                    <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-sm">Nhà cung cấp</h4>
                    <div className="space-y-1">
                      <p className="[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80"><span className="font-bold">Công ty:</span><span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span></p>
                      <p className="[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80"><span className="font-bold">Liên hệ:</span><span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span></p>
                      <p className="[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80"><span className="font-bold">Giá:</span><span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span></p>
                    </div>
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

      {editing && (
        <EditIngredientModal 
          open={true} 
          onClose={()=> setEditing(null)} 
          ingredient={((): { id: number; name: string; unit?: string; active?: boolean; ingredient_category_id?: number; categoryId?: number; category?: { id: number } | null; imgUrl?: string } => {
            const maybeAny = editing as unknown as { ingredient_category_id?: number; categoryId?: number; category?: { id?: number } | null; imgUrl?: string }
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