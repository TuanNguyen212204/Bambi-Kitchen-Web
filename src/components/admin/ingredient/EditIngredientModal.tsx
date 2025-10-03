import { useEffect, useState } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useIngredientStore } from "@zustand/stores/ingredients"

interface Props { open: boolean; onClose: () => void; ingredient: { id: number; name: string; unit?: string; active?: boolean; category?: unknown } }

export default function EditIngredientModal({ open, onClose, ingredient }: Props) {
  const { categories, fetchCategories, update, adjustStock } = useIngredientStore()
  const [delta, setDelta] = useState<string>("0")
  const [name, setName] = useState(ingredient?.name ?? "")
  const [unit, setUnit] = useState(ingredient?.unit ?? "GRAM")
  const [active, setActive] = useState<boolean>(ingredient?.active ?? true)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [nameError, setNameError] = useState<string>("")
  const [deltaError, setDeltaError] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetchCategories()
      setName(ingredient?.name ?? "")
      setUnit(ingredient?.unit ?? "GRAM")
      setActive(ingredient?.active ?? true)
    }
  }, [open, fetchCategories, ingredient])

  if (!open) return null

  const submit = async () => {
    if (!ingredient?.id) return
    // Chỉ gọi update nếu có thay đổi trường thông tin
    const changedInfo =
      name !== (ingredient.name ?? "") ||
      unit !== (ingredient.unit ?? "GRAM") ||
      active !== (ingredient.active ?? true) ||
      typeof categoryId === "number"

    try {
      // validate
      setNameError("")
      setDeltaError("")
      const NAME_RE = /^[\p{L}\p{N} ]+$/u
      if (!name.trim()) { setNameError("Tên nguyên liệu là bắt buộc"); return }
      if (!NAME_RE.test(name.trim())) { setNameError("Tên chỉ gồm chữ/số và khoảng trắng"); return }
      const DELTA_RE = /^-?\d+$/
      if (delta.trim() !== "" && !DELTA_RE.test(delta.trim())) { setDeltaError("Số điều chỉnh chỉ là số nguyên, có thể có 1 dấu trừ ở đầu"); return }
      const deltaNum = Number(delta || 0)
      if (changedInfo) {
        await update({ id: ingredient.id, name, unit, active, categoryId })
      }
      if (deltaNum) {
        await adjustStock(ingredient.id, deltaNum)
      }
      onClose()
    } catch {
      // lỗi được toast ở store, chỉ giữ modal mở để người dùng sửa
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="text-lg font-semibold">Chỉnh sửa nguyên liệu</div>
        <div>
          <Label className="mb-1 block">Tên nguyên liệu</Label>
          <Input value={name} onChange={(e)=> { setName(e.target.value); setNameError("") }} className={nameError? 'border-red-500' : ''} />
          {nameError && <div className="text-red-600 text-xs mt-1">{nameError}</div>}
        </div>
        <div>
          <Label className="mb-1 block">Danh mục</Label>
          <select className="w-full h-10 border rounded px-3" value={categoryId ?? ""} onChange={(e)=> setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Giữ nguyên</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={active} onChange={(e)=> setActive(e.target.checked)} />
          <Label htmlFor="active">Đang hoạt động</Label>
        </div>
        <div className="border-t pt-3 space-y-2">
          <div className="font-medium">Điều chỉnh tồn kho</div>
          <div className="flex items-center gap-2">
            <Input className={`w-32 text-center ${deltaError? 'border-red-500' : ''}`} type="text" value={delta} onChange={(e)=> { setDelta(e.target.value); setDeltaError("") }} placeholder="0" />
            <Button variant="outline" onClick={()=> setDelta("0")}>Reset</Button>
          </div>
          {deltaError && <div className="text-red-600 text-xs">{deltaError}</div>}
          <div className="text-xs text-gray-500">Nhập số dương để nhập kho, số âm để xuất kho. Việc điều chỉnh sẽ tạo giao dịch tồn kho và cập nhật tồn ngay sau khi bấm Lưu.</div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submit}>Lưu</Button>
        </div>
      </div>
    </div>
  )
}


