import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useDishStore } from "@zustand/stores/dish"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

type SizeCode = "S" | "M" | "L"

export default function AdminDishTemplatePage() {
  const store = useDishStore()
  const { templates, fetchTemplates, upsertTemplate, removeTemplate } = store
  const [editing, setEditing] = useState<typeof templates[number] | null>(null)

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const upsert = async () => {
    if (!editing) return
    await upsertTemplate(editing)
    setEditing(null)
  }

  const remove = async (size: SizeCode) => {
    await removeTemplate(size)
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
                  <div className="text-sm text-gray-600">priceRatio: {t.priceRatio} • qtyRatio: {t.quantityRatio}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=> setEditing(t)}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={()=> remove(t.size)}>Xóa</Button>
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
              <select className="w-full h-10 border rounded px-3" value={editing.size} onChange={(e)=> setEditing({ ...(editing as any), size: e.target.value as SizeCode })}>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">Tên hiển thị</Label>
              <Input value={editing.name} onChange={(e)=> setEditing({ ...(editing as any), name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">priceRatio</Label>
                <Input type="number" value={editing.priceRatio} onChange={(e)=> setEditing({ ...(editing as any), priceRatio: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">quantityRatio</Label>
                <Input type="number" value={editing.quantityRatio} onChange={(e)=> setEditing({ ...(editing as any), quantityRatio: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block">max_Carb</Label>
                <Input type="number" value={editing.max_Carb || 0} onChange={(e)=> setEditing({ ...(editing as any), max_Carb: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">max_Protein</Label>
                <Input type="number" value={editing.max_Protein || 0} onChange={(e)=> setEditing({ ...(editing as any), max_Protein: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="mb-1 block">max_Vegetable</Label>
                <Input type="number" value={editing.max_Vegetable || 0} onChange={(e)=> setEditing({ ...(editing as any), max_Vegetable: Number(e.target.value) })} />
              </div>
            </div>
          </ModalForm>
          <ModalActions onCancel={()=> setEditing(null)} onConfirm={upsert} confirmText="Lưu" />
        </ReusableModal>
      )}
    </div>
  )
}


