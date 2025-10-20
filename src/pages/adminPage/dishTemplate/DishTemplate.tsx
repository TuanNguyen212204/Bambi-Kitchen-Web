import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useDishStore } from "@zustand/stores/dish"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { TrashIcon } from "lucide-react"
import type { DishTemplateItem } from "@zustand/slices/dish/template.slice"

type SizeCode = "S" | "M" | "L"

export default function AdminDishTemplatePage() {
  const store = useDishStore()
  const { templates, fetchTemplates, upsertTemplate, removeTemplate } = store
  const [editing, setEditing] = useState<DishTemplateItem | null>(null)
  const [deleting, setDeleting] = useState<DishTemplateItem | null>(null)

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const upsert = async () => {
    if (!editing) return
    await upsertTemplate(editing)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await removeTemplate(deleting.size)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Mẫu tô</h1>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={()=> setEditing({ size: "S", name: "Small", priceRatio: 1, quantityRatio: 1 })}>Thêm</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.size} className="border">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{t.name} ({t.size})</div>
                  <div className="text-sm text-gray-600">Tỷ lệ giá: {t.priceRatio} • Tỷ lệ số lượng: {t.quantityRatio}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=> setEditing(t)}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={()=> setDeleting(t)}>Xóa</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <ReusableModal
          open={true}
          onClose={()=> setEditing(null)}
          title="Chỉnh sửa mẫu tô"
          size="xl"
          contentClassName="sm:max-w-[560px] md:max-w-[720px] lg:max-w-[960px] max-h-[80vh] overflow-y-auto"
        >
          <ModalForm onSubmit={(e)=> { e.preventDefault(); upsert() }}>
            <div>
              <Label className="mb-1 block">Kích cỡ</Label>
              <select className="w-full h-10 border rounded px-3" value={editing.size} onChange={(e)=> setEditing({ ...editing, size: e.target.value as SizeCode })}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">Tên hiển thị</Label>
              <Input value={editing.name} onChange={(e)=> setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Tỷ lệ giá</Label>
                <Input type="number" value={editing.priceRatio} onChange={(e)=> setEditing({ ...editing, priceRatio: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">Tỷ lệ số lượng</Label>
                <Input type="number" value={editing.quantityRatio} onChange={(e)=> setEditing({ ...editing, quantityRatio: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block">Tối đa Carb</Label>
                <Input type="number" value={editing.max_Carb || 0} onChange={(e)=> setEditing({ ...editing, max_Carb: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">Tối đa Protein</Label>
                <Input type="number" value={editing.max_Protein || 0} onChange={(e)=> setEditing({ ...editing, max_Protein: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">Tối đa Rau củ</Label>
                <Input type="number" value={editing.max_Vegetable || 0} onChange={(e)=> setEditing({ ...editing, max_Vegetable: Number(e.target.value) })} />
              </div>
            </div>
          </ModalForm>
          <ModalActions onCancel={()=> setEditing(null)} onConfirm={upsert} confirmText="Lưu" />
        </ReusableModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`} style={{ marginTop: 0 }}>
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
                Bạn có chắc chắn muốn xóa mẫu tô <span className="font-semibold">"{deleting.name} ({deleting.size})"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tất cả dữ liệu liên quan đến mẫu tô này sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={()=> setDeleting(null)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


