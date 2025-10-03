import { useEffect, useState } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useIngredientStore } from "@zustand/stores/ingredients"

interface Props { open: boolean; onClose: () => void }

export default function AddCategoryModal({ open, onClose }: Props) {
  const { categories, fetchCategories, createCategory } = useIngredientStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string>("")

  useEffect(() => { if (open) fetchCategories() }, [open, fetchCategories])
  if (!open) return null

  const submit = async () => {
    const NAME_RE = /^[\p{L}\p{N} ]+$/u
    if (!name.trim()) { setError("Tên danh mục là bắt buộc"); return }
    if (!NAME_RE.test(name.trim())) { setError("Tên chỉ gồm chữ/số và khoảng trắng"); return }
    await createCategory({ name: name.trim(), description: description.trim() || undefined })
    setName("")
    setDescription("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="text-lg font-semibold">Thêm danh mục nguyên liệu</div>
        <div>
          <Label className="mb-1 block">Tên danh mục</Label>
          <Input value={name} onChange={(e)=> { setName(e.target.value); setError("") }} placeholder="VD: Thịt, Rau, Hải sản..." />
          {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
        </div>
        <div>
          <Label className="mb-1 block">Mô tả (tuỳ chọn)</Label>
          <Input value={description} onChange={(e)=> setDescription(e.target.value)} placeholder="Mô tả ngắn" />
        </div>
        <div className="max-h-32 overflow-auto border rounded p-2 text-sm">
          {categories.map(c => (
            <div key={c.id} className="py-1">• {c.name}</div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submit}>Lưu</Button>
        </div>
      </div>
    </div>
  )
}


