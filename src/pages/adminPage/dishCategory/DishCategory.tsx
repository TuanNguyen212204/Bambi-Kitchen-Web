import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useDishStore } from "@zustand/stores/dish"

export default function AdminDishCategoryPage() {
  const { categories, fetchCategories, createCategory, updateCategory, removeCategory } = useDishStore()
  const [openAdd, setOpenAdd] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const submit = async () => {
    if (!name.trim()) return
    if (editingId) await updateCategory({ id: editingId, name: name.trim(), description: description.trim() || undefined })
    else await createCategory({ name: name.trim(), description: description.trim() || undefined })
    setOpenAdd(false); setEditingId(null); setName(""); setDescription("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Danh mục món</h1>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={()=> { setOpenAdd(true); setEditingId(null) }}>Thêm danh mục</Button>
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
                  <Button size="sm" variant="outline" onClick={()=> { setEditingId(c.id); setName(c.name); setDescription(c.description || ""); setOpenAdd(true) }}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={()=> removeCategory(c.id)}>Xóa</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReusableModal 
        open={openAdd} 
        onClose={()=> { setOpenAdd(false); setEditingId(null); setName(""); setDescription("") }} 
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
          onCancel={()=> { setOpenAdd(false); setEditingId(null); setName(""); setDescription("") }} 
          onConfirm={submit}
          confirmText={editingId? "Lưu" : "Tạo"}
        />
      </ReusableModal>
    </div>
  )
}


