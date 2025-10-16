import { useEffect, useMemo, useState } from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useDishStore } from "@zustand/stores/dish"
import { useIngredientStore } from "@zustand/stores/ingredients"

interface Props { open: boolean; onClose: () => void; dish: { id: number; name: string; description?: string; price?: number; public?: boolean; active?: boolean; ingredients?: Record<number, number> } }

export default function EditDishModal({ open, onClose, dish }: Props) {
  const { createOrUpdate } = useDishStore()
  const ingStore = useIngredientStore()

  const [name, setName] = useState(dish?.name ?? "")
  const [description, setDescription] = useState(dish?.description ?? "")
  const [price, setPrice] = useState<string>(dish?.price != null ? String(dish.price) : "")
  const [isPublic, setIsPublic] = useState(dish?.public ?? true)
  const [isActive, setIsActive] = useState(dish?.active ?? true)
  const [ingredients, setIngredients] = useState<Record<number, number>>(dish?.ingredients ?? {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => { if (open) ingStore.fetchAll() }, [open])
  useEffect(() => {
    if (open) {
      setName(dish?.name ?? "")
      setDescription(dish?.description ?? "")
      setPrice(dish?.price != null ? String(dish.price) : "")
      setIsPublic(dish?.public ?? true)
      setIsActive(dish?.active ?? true)
      setIngredients(dish?.ingredients ?? {})
      setLoading(false)
      setError("")
    }
  }, [open, dish])

  const ingredientList = useMemo(() => ingStore.items, [ingStore.items])

  const submit = async () => {
    setError("")
    if (!dish?.id) return
    const n = name.trim()
    if (!n) { setError("Tên món là bắt buộc"); return }
    const p = price.trim() === "" ? undefined : Number(price.replaceAll(",", ""))
    if (p != null && Number.isNaN(p)) { setError("Giá không hợp lệ"); return }
    if (!Object.keys(ingredients).length) { setError("Vui lòng chọn nguyên liệu và định lượng"); return }
    setLoading(true)
    try {
      await createOrUpdate({
        id: dish.id,
        name: n,
        description: description.trim() || undefined,
        price: p,
        dishType: "PRESET",
        ingredients,
        public: isPublic,
        active: isActive,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReusableModal 
      open={open} 
      onClose={onClose} 
      title="Chỉnh sửa món" 
      size="xl"
      contentClassName="sm:max-w-[560px] md:max-w-[720px] lg:max-w-[960px] max-h-[80vh] overflow-y-auto"
    >
      <ModalForm onSubmit={(e)=> { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tên món</Label>
          <Input value={name} onChange={(e)=> setName(e.target.value)} className={error? 'border-red-500' : ''} />
        </div>
        <div>
          <Label className="mb-1 block">Mô tả</Label>
          <Input value={description} onChange={(e)=> setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1 block">Giá (đ)</Label>
          <Input value={price} onChange={(e)=> setPrice(e.target.value)} placeholder="VD: 45000" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={(e)=> setIsPublic(e.target.checked)} />
            <span>Công khai</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} />
            <span>Hoạt động</span>
          </label>
        </div>
        <div>
          <Label className="mb-1 block">Nguyên liệu & định lượng</Label>
          <div className="space-y-2">
            {ingredientList.map((ing: any) => {
              const val = ingredients[ing.id] ?? 0
              return (
                <div key={ing.id} className="flex items-center gap-3">
                  <span className="w-48 text-sm">{ ing.name }</span>
                  <Input 
                    className="w-32 text-center"
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e)=> setIngredients((prev)=> ({ ...prev, [ing.id]: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              )
            })}
          </div>
        </div>
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      </ModalForm>
      <ModalActions onCancel={onClose} onConfirm={submit} loading={loading} confirmText="Lưu" cancelText="Hủy" disabled={!name.trim()} />
    </ReusableModal>
  )
}


