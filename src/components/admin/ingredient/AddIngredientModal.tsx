import { useState, useEffect } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useIngredientStore } from "@zustand/stores/ingredients"

interface Props { open: boolean; onClose: () => void }

export default function AddIngredientModal({ open, onClose }: Props) {
  const { categories, fetchCategories, create } = useIngredientStore()
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("GRAM")
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [errors, setErrors] = useState<{ name?: string; category?: string }>({})

  useEffect(() => { if (open) fetchCategories() }, [open, fetchCategories])

  if (!open) return null

  const submit = async () => {
    const e: { name?: string; category?: string } = {}
    const NAME_RE = /^[\p{L}\p{N} ]+$/u
    if (!name.trim()) e.name = "Tên nguyên liệu là bắt buộc"
    else if (!NAME_RE.test(name.trim())) e.name = "Tên chỉ gồm chữ/số và khoảng trắng"
    if (!categoryId) e.category = "Vui lòng chọn danh mục"
    setErrors(e)
    if (Object.keys(e).length) return
    await create({ name: name.trim(), categoryId, unit })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="text-lg font-semibold">Thêm nguyên liệu</div>
        <div>
          <Label className="mb-1 block">Tên nguyên liệu</Label>
          <Input value={name} onChange={(e)=> setName(e.target.value)} placeholder="VD: Thịt bò" />
          {errors.name && <div className="text-red-600 text-xs mt-1">{errors.name}</div>}
        </div>
        <div>
          <Label className="mb-1 block">Danh mục</Label>
          <select className={`w-full h-10 border rounded px-3 ${errors.category? 'border-red-500': ''}`} value={categoryId ?? ""} onChange={(e)=> setCategoryId(Number(e.target.value))}>
            <option value="">Chọn danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category && <div className="text-red-600 text-xs mt-1">{errors.category}</div>}
        </div>
        <div>
          <Label className="mb-1 block">Đơn vị</Label>
          <select className="w-full h-10 border rounded px-3" value={unit} onChange={(e)=> setUnit(e.target.value)}>
            <option value="GRAM">GRAM</option>
            <option value="KILOGRAM">KILOGRAM</option>
            <option value="LITER">LITER</option>
            <option value="PCS">PCS</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submit}>Tạo</Button>
        </div>
      </div>
    </div>
  )
}


