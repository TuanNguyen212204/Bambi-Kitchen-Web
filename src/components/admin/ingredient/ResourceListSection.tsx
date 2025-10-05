import { Badge } from "@components/ui/badge/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card/card";
import { Grid3X3, List, MoreVertical, Edit3, Trash2, Image as ImageIcon } from "lucide-react";
import { useEffect } from "react";
import { useIngredientStore } from "@/zustand/stores/ingredients";
import { useState } from "react";
import EditIngredientModal from "@components/admin/ingredient/EditIngredientModal";
import StockHistoryModal from "@components/admin/ingredient/StockHistoryModal";
import DeleteConfirmationModal from "@components/admin/ingredient/DeleteConfirmationModal";

export function ResourceListSection(): JSX.Element {
  const { filteredItems, loading, fetchAll, viewMode, setViewMode, setSortBy, remove } = useIngredientStore()
  const count = filteredItems().length
  const [editing, setEditing] = useState<null | { id: number; name: string; unit?: string; active?: boolean; category?: unknown }>(null)
  const [stockHistory, setStockHistory] = useState<null | { id: number; name: string; unit?: string }>(null)
  const [deleting, setDeleting] = useState<null | { id: number; name: string }>(null)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <section className="w-full bg-white rounded-xl border border-solid border-gray-200 shadow-[0px_1px_3px_#0000001a] overflow-hidden">
      <header className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg tracking-[0] leading-[27px]">
          Danh sách Nguyên liệu ({count} loại)
        </h2>

        <div className="flex gap-2">
          <Button className={`h-auto ${viewMode==='grid'?'bg-orange-600 text-white':'bg-white text-black'} hover:bg-orange-700 border border-solid px-3 py-2`} size="sm" onClick={()=> setViewMode("grid") }>
            <Grid3X3 className="w-4 h-4 mr-1" />
            <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">Grid</span>
          </Button>

          <Button variant="outline" className={`h-auto ${viewMode==='list'?'bg-orange-600 text-white':'bg-white text-black'} border-gray-300 px-3 py-2`} size="sm" onClick={()=> { setViewMode("list"); setSortBy("priority") } }>
            <List className="w-4 h-4 mr-1" />
            <span className="[font-family:'Arial-Narrow',Helvetica] font-normal text-[13.3px]">List</span>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "grid grid-cols-1 gap-3"}>
          {filteredItems().map((ingredient: { id: number; name: string; unit?: string; category?: unknown; stock?: number; stockStatus?: 'out'|'low'|'normal'; imgUrl?: string; publicId?: string }) => (
            <Card key={ingredient.id} className={`bg-white border-2 border-gray-200`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {ingredient.imgUrl ? (
                        <img 
                          key={`${ingredient.id}-${ingredient.imgUrl}`}
                          src={ingredient.imgUrl} 
                          alt={ingredient.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        ingredient.stockStatus === 'out' ? 'bg-red-500' : 
                        ingredient.stockStatus === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg tracking-[0] leading-[27px]`}>{ingredient.name}</h3>
                      <p className={`[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[0] leading-[21px] opacity-75`}>{ingredient.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#0000001a] hover:bg-[#0000001a] px-3 py-1">
                    <span className={`[font-family:'Arial-Narrow',Helvetica] font-normal text-gray-700 text-sm text-center`}>
                      {(() => {
                        const cat: unknown = (ingredient as unknown as { category?: unknown }).category
                        if (cat && typeof cat === "object" && "name" in (cat as Record<string, unknown>)) {
                          return String((cat as { name: unknown }).name ?? "")
                        }
                        return String(cat ?? "")
                      })()}
                    </span>
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
                      <button className="px-3 py-2 flex items-center gap-2 w-full hover:bg-gray-100" onClick={()=> setDeleting({ id: ingredient.id, name: ingredient.name })}>
                        <Trash2 className="w-4 h-4 text-red-600" /> Delete
                      </button>
                    </div>
                  </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Tồn kho hiện tại</span>
                    <span className="text-sm text-gray-700">{ingredient.stock ?? "—"}</span>
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
                    <span className={`[font-family:'Arial-Narrow',Helvetica] font-normal text-xs text-center`}>Lịch sử tồn kho</span>
                  </Button>
                </div>

                <div className="bg-[#0000001a] rounded-md p-3 space-y-2">
                  <h4 className={`[font-family:'Inter-SemiBold',Helvetica] font-semibold text-sm`}>
                    Nhà cung cấp
                  </h4>

                  <div className="space-y-1">
                    <p className={`[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80`}>
                      <span className="font-bold">Công ty:</span>
                      <span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span>
                    </p>
                    <p className={`[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80`}>
                      <span className="font-bold">Liên hệ:</span>
                      <span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span>
                    </p>
                    <p className={`[font-family:'Inter-Bold',Helvetica] font-normal text-gray-700 text-xs opacity-80`}>
                      <span className="font-bold">Giá:</span>
                      <span className="[font-family:'Inter-Regular',Helvetica]"> N/A</span>
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
          {loading && <div className="col-span-full text-center text-sm text-gray-500">Đang tải dữ liệu...</div>}
        </div>
      </div>
      {editing && (
        <EditIngredientModal open={true} onClose={()=> setEditing(null)} ingredient={editing} />
      )}
      {stockHistory && (
        <StockHistoryModal open={true} onClose={()=> setStockHistory(null)} ingredient={stockHistory} />
      )}
      {deleting && (
        <DeleteConfirmationModal 
          open={true} 
          onClose={()=> setDeleting(null)} 
          onConfirm={() => remove(deleting.id)}
          ingredientName={deleting.name}
        />
      )}
    </section>
  );
}

export default ResourceListSection;



