import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Grid3X3, List, Plus, Search, MoreVertical, Edit3, Trash2 as TrashIcon, Image as ImageIcon } from "lucide-react"
import { useDishStore } from "@zustand/stores/dish"
import AddDishModal from "@components/admin/dish/AddDishModal"
import EditDishModal from "@components/admin/dish/EditDishModal"
import AddDishCategoryModal from "@components/admin/dish/AddDishCategoryModal"

const AdminDishPage = () => {
  const currentDate = new Date().toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })

  const store = useDishStore()
  const { fetchAll, items, categories, fetchCategories, setQuery, setSelectedCategoryId, statusFilter, setStatusFilter, viewMode, setViewMode, remove } = store as any

  const [openAdd, setOpenAdd] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [editing, setEditing] = useState<null | { id: number; name: string }>(null)
  const [deleting, setDeleting] = useState<null | { id: number; name: string }>(null)

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filtered = useMemo(() => store.getFilteredItems(), [store])

  const total = items.length
  const publicCount = items.filter((i: { public?: boolean }) => i.public === true).length
  const activeCount = items.filter((i: { active?: boolean }) => i.active !== false).length

  const metricCards = [
    { title: "Tổng món", value: String(total), icon: "🍽️" },
    { title: "Công khai", value: String(publicCount), icon: "🌐" },
    { title: "Đang hoạt động", value: String(activeCount), icon: "✅" },
  ]

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px] leading-[42px]">
            Quản lý Món ăn
          </h1>
          <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm leading-[21px]">
            Hôm nay: {currentDate}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl text-orange-600">{card.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">Quản lý Món ăn</h2>
            <div className="flex gap-2">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white h-auto px-3 py-1 text-sm" onClick={()=> setOpenAdd(true)}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="[font-family:'Arial-Narrow',Helvetica] text-sm">Thêm món mới</span>
              </Button>
              <Button className="bg-gray-600 hover:bg-gray-700 text-white h-auto px-3 py-1 text-sm" onClick={()=> setOpenCategory(true)}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="[font-family:'Arial-Narrow',Helvetica] text-sm">Thêm danh mục</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Tìm kiếm món</Label>
              <Input
                placeholder="Tên món..."
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm h-auto py-2"
                value={keyword}
                onChange={(e)=> { setKeyword(e.target.value); setQuery(e.target.value) }}
              />
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Danh mục</Label>
              <Select value={store.selectedCategoryId ? String(store.selectedCategoryId) : 'all'} onValueChange={(val)=> setSelectedCategoryId(val === 'all' ? undefined : Number(val))}>
                <SelectTrigger className="bg-white h-auto py-2 text-sm">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Trạng thái</Label>
              <Select value={statusFilter || 'all'} onValueChange={(val)=> setStatusFilter((val as any) || 'all')}>
                <SelectTrigger className="bg-white h-auto py-2 text-sm">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="public">Công khai</SelectItem>
                  <SelectItem value="private">Riêng tư</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Tìm kiếm</Label>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-auto py-2 text-sm">
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg leading-[27px]">Danh sách Món ăn ({filtered.length})</h3>
            <div className="flex gap-2">
              <Button className={`h-auto ${viewMode==='grid'? 'bg-orange-600 text-white' : 'bg-white text-black'} hover:bg-orange-700 border border-solid px-3 py-1 text-sm`} size="sm" onClick={()=> setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4 mr-1" />
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">Grid</span>
              </Button>
              <Button variant="outline" className={`h-auto ${viewMode==='list'? 'bg-orange-600 text-white' : 'bg-white text-black'} border-gray-300 px-3 py-1 text-sm`} size="sm" onClick={()=> setViewMode('list')}>
                <List className="w-4 h-4 mr-1" />
                <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">List</span>
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'grid grid-cols-1 gap-3'}>
            {filtered.map((dish: any) => (
              <Card key={dish.id} className={`bg-white border-2 border-gray-200`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {dish.imageUrl ? (
                          <img 
                            key={`${dish.id}-${dish.imageUrl}`}
                            src={dish.imageUrl} 
                            alt={dish.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e)=>{
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
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${dish.active === false ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      </div>
                      <div>
                        <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-sm leading-[20px]">{dish.name}</h3>
                        {typeof dish.price === 'number' && (
                          <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-xs leading-[16px] opacity-75">{dish.price.toLocaleString('vi-VN')} đ</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button className="w-8 h-8 rounded hover:bg-black/10 flex items-center justify-center" onClick={(e)=>{
                          const menu = (e.currentTarget.nextSibling as HTMLElement)
                          if (menu) menu.classList.toggle('hidden')
                        }}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 bg-white border rounded shadow hidden z-10">
                          <button className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100" onClick={()=> setEditing({ id: dish.id, name: dish.name })}>
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                          <button className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100" onClick={()=> setDeleting({ id: dish.id, name: dish.name })}>
                            <TrashIcon className="w-4 h-4 text-red-600" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <AddDishModal open={openAdd} onClose={()=> setOpenAdd(false)} />
      <AddDishCategoryModal open={openCategory} onClose={()=> setOpenCategory(false)} />
      {editing && (
        <EditDishModal open={true} onClose={()=> setEditing(null)} dish={{ id: editing.id, name: editing.name }} />
      )}
      {deleting && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa món <span className="font-semibold">"{deleting.name}"</span>?
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={()=> setDeleting(null)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={()=> { remove(deleting.id); setDeleting(null); }}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDishPage