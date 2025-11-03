import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { IngredientCategory } from "@/models/category/category"
import { Input } from "@components/ui/input"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useDishStore } from "@zustand/stores/dish"
import { useAuthStore } from "@zustand/stores/auth"
import { useIngredientStore } from "@zustand/stores/ingredients"

interface Props { open: boolean; onClose: () => void }

export default function AddDishModal({ open, onClose }: Props) {
  const { createOrUpdate } = useDishStore()
  const { user } = useAuthStore()
  const ingStore = useIngredientStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<string>("")
  const [dishType, setDishType] = useState<"PRESET" | "CUSTOM">("PRESET")
  const [isPublic, setIsPublic] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [ingredients, setIngredients] = useState<Record<number, number>>({})
  const [file, setFile] = useState<File | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const fetchedOnceRef = useRef(false)
  const fetchIngredientsOnce = useCallback(() => {
    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true
      ingStore.fetchAll()
      if (typeof ingStore.fetchCategories === 'function') {
        ingStore.fetchCategories()
      }
    }
  }, [ingStore])
  useEffect(() => {
    if (open) fetchIngredientsOnce()
  }, [open, fetchIngredientsOnce])
  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
      setPrice("")
      setDishType("PRESET")
      setIsPublic(true)
      setIsActive(true)
      setIngredients({})
      setFile(undefined)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(undefined)
      setLoading(false)
      setError("")
      fetchedOnceRef.current = false
    }
  }, [open, previewUrl])

  const ingredientList = useMemo(() => ingStore.items, [ingStore.items])
  const ingredientById = useMemo(() => {
    const m = new Map<number, (typeof ingredientList)[number]>()
    ingredientList.forEach(i => m.set(i.id, i))
    return m
  }, [ingredientList])

  const [ingQuery, setIngQuery] = useState("")
  const [catFilter, setCatFilter] = useState<string>("all")

  const categories = useMemo(() => {
    const options: { key: string; id?: number; name: string; count: number }[] = []
    const rawCats = (ingStore as unknown as { categories?: IngredientCategory[] }).categories
    const catList: IngredientCategory[] = Array.isArray(rawCats) ? rawCats : []
    catList.forEach((cat) => {
      const count = ingredientList.filter(i => i.categoryId === cat.id).length
      options.push({ key: String(cat.id), id: cat.id, name: cat.name, count })
    })
    const uncategorizedCount = ingredientList.filter(i => i.categoryId == null).length
    if (uncategorizedCount > 0) options.push({ key: "__uncat__", name: "Khác", count: uncategorizedCount })
    return options.sort((a,b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name, "vi")
    })
  }, [ingStore, ingredientList])

  // Chọn mặc định danh mục đầu tiên khi có data
  // Giữ mặc định "all" để người dùng thấy toàn bộ nếu muốn
  useEffect(() => {
    if (catFilter !== "all" && !categories.some(c => c.key === catFilter)) {
      setCatFilter("all")
    }
  }, [categories, catFilter])

  const currentList = useMemo(() => {
    const q = ingQuery.trim().toLowerCase()
    const base = catFilter === "all" 
      ? ingredientList 
      : ingredientList.filter(i => (i.categoryId != null ? String(i.categoryId) : "__uncat__") === catFilter)
    return q ? base.filter(i => i.name.toLowerCase().includes(q)) : base
  }, [ingredientList, ingQuery, catFilter])

  const submit = async () => {
    setError("")
    const n = name.trim()
    if (!n) { setError("Tên món là bắt buộc"); return }
    const p = price.trim() === "" ? undefined : Number(price.replaceAll(",", ""))
    if (p != null && Number.isNaN(p)) { setError("Giá không hợp lệ"); return }
    if (!Object.keys(ingredients).length) { setError("Vui lòng chọn nguyên liệu và định lượng"); return }
    setLoading(true)
    try {
      await createOrUpdate({
        name: n,
        description: description.trim() || undefined,
        price: p,
        account: user?.id ? { id: user.id } : undefined,
        dishType,
        ingredients,
        public: isPublic,
        active: isActive,
        file,
      })
      const { toast } = await import("sonner")
      toast.success("Tạo món thành công")
      // refresh danh sách với filter hiện tại để giữ nguyên view
      const currentFilter = useDishStore.getState().statusFilter || "all"
      await useDishStore.getState().fetchAll(currentFilter).catch(() => undefined)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReusableModal 
      open={open} 
      onClose={onClose} 
      title="Thêm món" 
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
        <div>
          <Label className="mb-1 block">Ảnh món ăn (tùy chọn)</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e)=> {
              const f = e.target.files?.[0]
              setFile(f)
              if (previewUrl) URL.revokeObjectURL(previewUrl)
              setPreviewUrl(f ? URL.createObjectURL(f) : undefined)
            }}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
          <p className="mt-1 text-xs text-gray-500">Nên chọn ảnh vuông, dung lượng &lt; 2MB.</p>
          {previewUrl && (
            <div className="mt-3">
              <img src={previewUrl} alt="Xem trước ảnh" className="w-28 h-28 rounded-md object-cover border" />
            </div>
          )}
        </div>
        <div>
          <Label className="mb-2 block">Loại món</Label>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Button
              type="button"
              onClick={()=> setDishType('PRESET')}
              className={`rounded-none px-4 py-2 text-sm ${dishType==='PRESET' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              PRESET
            </Button>
            <Button
              type="button"
              onClick={()=> setDishType('CUSTOM')}
              className={`rounded-none px-4 py-2 text-sm border-l ${dishType==='CUSTOM' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              CUSTOM
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            <span className="font-medium">PRESET</span>: Món có công thức sẵn (đề xuất mặc định). <span className="font-medium">CUSTOM</span>: Món tùy chỉnh nguyên liệu theo khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm cursor-pointer select-none">
            <input className="accent-orange-600 w-4 h-4" type="checkbox" checked={isPublic} onChange={(e)=> setIsPublic(e.target.checked)} />
            <span className="text-sm text-gray-700">Công khai</span>
          </label>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm cursor-pointer select-none">
            <input className="accent-orange-600 w-4 h-4" type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} />
            <span className="text-sm text-gray-700">Hoạt động</span>
          </label>
        </div>
        <div>
          <Label className="mb-1 block">Nguyên liệu & định lượng</Label>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Input
                placeholder="Tìm nguyên liệu..."
                value={ingQuery}
                onChange={(e)=> setIngQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={catFilter} onValueChange={(v)=> setCatFilter(v)}>
                <SelectTrigger className="bg-white h-auto py-2 shadow-sm">
                  <SelectValue placeholder="Chọn loại nguyên liệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.name} ({c.count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{currentList.length} nguyên liệu</span>
            {catFilter !== "all" && (
              <span>Danh mục: {categories.find(c=>c.key===catFilter)?.name || "Khác"}</span>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 border rounded-md">
            {currentList.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">Không có nguyên liệu trong danh mục này</div>
            ) : (
              currentList.map((ing) => {
                const val = ingredients[ing.id] ?? 0
                return (
                  <div key={ing.id} className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                    <span className="flex-1 text-sm truncate" title={ing.name}>{ ing.name }</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        className="w-28 text-center"
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e)=> setIngredients((prev)=> ({ ...prev, [ing.id]: Number(e.target.value) }))}
                        placeholder="0"
                      />
                      <span className="w-12 text-xs text-gray-500 text-right uppercase" title={`Đơn vị: ${String(ing.unit || '').toLowerCase()}`}>{String(ing.unit || '').toLowerCase()}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="mt-4">
            {Object.entries(ingredients).filter(([,q]) => (q ?? 0) > 0).length > 0 ? (
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800">
                    Nguyên liệu đã chọn ({Object.entries(ingredients).filter(([,q]) => (q ?? 0) > 0).length})
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => setIngredients({})}
                  >
                    Xóa tất cả
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="min-w-full divide-y">
                    {Object.entries(ingredients)
                      .filter(([,q]) => (q ?? 0) > 0)
                      .map(([idStr, qty]) => {
                        const id = Number(idStr)
                        const ing = ingredientById.get(id)
                        if (!ing) return null
                        return (
                          <div key={id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2">
                            <div className="text-sm text-gray-800 truncate" title={ing.name}>{ing.name}</div>
                            <div className="text-right text-sm tabular-nums">{qty}</div>
                            <div className="text-xs uppercase text-gray-500 w-14 text-right">{String(ing.unit || '').toLowerCase()}</div>
                            <div className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-auto py-1 px-2 text-xs"
                                onClick={() => setIngredients((prev) => ({ ...prev, [id]: 0 }))}
                              >
                                Gỡ
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">Chưa chọn nguyên liệu nào.</div>
            )}
          </div>
        </div>
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      </ModalForm>
      <ModalActions onCancel={onClose} onConfirm={submit} loading={loading} confirmText="Tạo" cancelText="Hủy" disabled={!name.trim()} />
    </ReusableModal>
  )
}


