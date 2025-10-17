import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useIngredientStore } from "@zustand/stores/ingredients"

export default function AdminIngredientCategoryPage() {
  const { categories, fetchCategories, createCategory, updateCategory, removeCategory } = useIngredientStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const submit = async () => {
    if (!name.trim()) return
    if (editingId) await updateCategory({ id: editingId, name: name.trim(), description: description.trim() || undefined })
    else await createCategory({ name: name.trim(), description: description.trim() || undefined })
    setOpen(false); setEditingId(null); setName(""); setDescription("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Danh mục nguyên liệu</h1>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={()=> { setOpen(true); setEditingId(null) }}>Thêm danh mục</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="border">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  {c.description && <div className="text-sm text-gray-600">{c.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=> { setEditingId(c.id); setName(c.name); setDescription(c.description || ""); setOpen(true) }}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={()=> setConfirm({ id: c.id, name: c.name })}>Xóa</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReusableModal 
        open={open} 
        onClose={()=> { setOpen(false); setEditingId(null); setName(""); setDescription("") }} 
        title={editingId? "Sửa danh mục" : "Thêm danh mục"}
        size="xl"
        contentClassName="sm:max-w-[480px] md:max-w-[640px] lg:max-w-[800px] max-h-[80vh] overflow-y-auto"
      >
        <ModalForm onSubmit={(e)=> { e.preventDefault(); submit() }}>
          <div>
            <Label className="mb-1 block">Tên danh mục</Label>
            <Input value={name} onChange={(e)=> setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Mô tả</Label>
            <Input value={description} onChange={(e)=> setDescription(e.target.value)} />
          </div>
        </ModalForm>
        <ModalActions 
          onCancel={()=> { setOpen(false); setEditingId(null); setName(""); setDescription("") }} 
          onConfirm={submit}
          confirmText={editingId? "Lưu" : "Tạo"}
        />
      </ReusableModal>

      {confirm && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`} style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold">"{confirm.name}"</span>?</p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={()=> setConfirm(null)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={()=> { removeCategory(confirm.id); setConfirm(null) }}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


