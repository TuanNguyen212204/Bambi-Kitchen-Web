import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Button } from "@components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
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
  const [dishType, setDishType] = useState<"PRESET" | "CUSTOM">("PRESET")
  const [ingredients, setIngredients] = useState<Record<number, number>>(dish?.ingredients ?? {})
  const [file, setFile] = useState<File | undefined>(undefined)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const fetchedOnceRef = useRef(false)
  const fetchIngredientsOnce = useCallback(() => {
    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true
      ingStore.fetchAll()
      if (typeof ingStore.fetchCategories === 'function') ingStore.fetchCategories()
    }
  }, [ingStore])
  useEffect(() => { if (open) fetchIngredientsOnce() }, [open, fetchIngredientsOnce])
  useEffect(() => {
    if (open) {
      setName(dish?.name ?? "")
      setDescription(dish?.description ?? "")
      setPrice(dish?.price != null ? String(dish.price) : "")
      setDishType("PRESET")
      setIngredients(dish?.ingredients ?? {})
      setFile(undefined)
      setExistingImageUrl(undefined)
      setLoading(false)
      setError("")
    }
  }, [open, dish])

  useEffect(() => {
    const loadDetail = async () => {
      if (!open || !dish?.id) return
      try {
        const { bambiApi, API_ENDPOINTS } = await import("@/utils/api")
        const res = await bambiApi.get<{ id: number; name: string; description?: string; price?: number; imageUrl?: string; public?: boolean; active?: boolean }>(API_ENDPOINTS.API_DISH_BY_ID(dish.id))
        const d = res.data
        if (d) {
          setName(d.name || "")
          setDescription(d.description || "")
          setPrice(d.price != null ? String(d.price) : "")
          setExistingImageUrl(d.imageUrl)
        }
      } catch { return }
    }
    void loadDetail()
  }, [open, dish?.id])

  useEffect(() => {
    const fetchRecipe = async () => {
      if (open && dish?.id) {
        try {
          const { bambiApi, API_ENDPOINTS } = await import("@/utils/api")
          const res = await bambiApi.get<any[]>(API_ENDPOINTS.API_RECIPE_BY_DISH(dish.id))
          // res.data: array [{ id, ingredient: Ingredient, quantity, dish: Dish }]
          const recipe: Record<number, number> = {}
          if (Array.isArray(res.data)) {
            res.data.forEach(r => {
              if (r.ingredient?.id && typeof r.quantity === 'number') {
                recipe[r.ingredient.id] = r.quantity
              }
            })
            setIngredients(recipe)
          }
        } catch { /* ignore, giữ nguyên */ }
      }
    }
    if (open && dish?.id) fetchRecipe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish?.id])

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
    const rawCats = (ingStore as unknown as { categories?: Array<{ id: number; name: string }> }).categories
    const catList: Array<{ id: number; name: string }> = Array.isArray(rawCats) ? rawCats : []
    catList.forEach((cat) => {
      const count = ingredientList.filter(i => i.categoryId === cat.id).length
      options.push({ key: String(cat.id), id: cat.id, name: cat.name, count })
    })
    const uncategorizedCount = ingredientList.filter(i => i.categoryId == null).length
    if (uncategorizedCount > 0) options.push({ key: "__uncat__", name: "Khác", count: uncategorizedCount })
    return options.sort((a,b) => b.count - a.count || a.name.localeCompare(b.name, "vi"))
  }, [ingStore, ingredientList])
  useEffect(() => {
    if (catFilter !== "all" && !categories.some(c => c.key === catFilter)) setCatFilter("all")
  }, [categories, catFilter])
  const currentList = useMemo(() => {
    const q = ingQuery.trim().toLowerCase()
    const base = catFilter === "all" ? ingredientList : ingredientList.filter(i => (i.categoryId != null ? String(i.categoryId) : "__uncat__") === catFilter)
    return q ? base.filter(i => i.name.toLowerCase().includes(q)) : base
  }, [ingredientList, ingQuery, catFilter])

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
        dishType,
        ingredients,
        public: dish?.public ?? true,
        active: dish?.active ?? true,
        file,
      })
      const { toast } = await import("sonner")
      toast.success("Cập nhật món thành công")
      await useDishStore.getState().fetchAll().catch(() => undefined)
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
        <div>
          <Label className="mb-2 block">Loại món</Label>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Button type="button" onClick={()=> setDishType('PRESET')} className={`rounded-none px-4 py-2 text-sm ${dishType==='PRESET' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>PRESET</Button>
            <Button type="button" onClick={()=> setDishType('CUSTOM')} className={`rounded-none px-4 py-2 text-sm border-l ${dishType==='CUSTOM' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>CUSTOM</Button>
          </div>
          <p className="mt-2 text-xs text-gray-500"><span className="font-medium">PRESET</span>: Món có công thức sẵn. <span className="font-medium">CUSTOM</span>: Tùy chỉnh nguyên liệu.</p>
        </div>
        <div>
          <Label className="mb-1 block">Nguyên liệu & định lượng</Label>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Input placeholder="Tìm nguyên liệu..." value={ingQuery} onChange={(e)=> setIngQuery(e.target.value)} />
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
                      <Input className="w-28 text-center" type="number" min={0} value={val} onChange={(e)=> setIngredients((prev)=> ({ ...prev, [ing.id]: Number(e.target.value) }))} placeholder="0" />
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
                  <div className="text-sm font-medium text-gray-800">Nguyên liệu đã chọn ({Object.entries(ingredients).filter(([,q]) => (q ?? 0) > 0).length})</div>
                  <Button type="button" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => setIngredients({})}>Xóa tất cả</Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="min-w-full divide-y">
                    {Object.entries(ingredients).filter(([,q]) => (q ?? 0) > 0).map(([idStr, qty]) => {
                      const id = Number(idStr)
                      const ig = ingredientById.get(id)
                      if (!ig) return null
                      return (
                        <div key={id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2">
                          <div className="text-sm text-gray-800 truncate" title={ig.name}>{ig.name}</div>
                          <div className="text-right text-sm tabular-nums">{qty}</div>
                          <div className="text-xs uppercase text-gray-500 w-14 text-right">{String(ig.unit || '').toLowerCase()}</div>
                          <div className="text-right">
                            <Button type="button" variant="outline" className="h-auto py-1 px-2 text-xs" onClick={() => setIngredients((prev) => ({ ...prev, [id]: 0 }))}>Gỡ</Button>
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
          <div className="mt-3 flex items-center gap-3">
            {previewUrl ? (
              <img src={previewUrl} alt="Xem trước ảnh" className="w-28 h-28 rounded-md object-cover border" />
            ) : existingImageUrl ? (
              <img src={existingImageUrl} alt="Ảnh hiện tại" className="w-28 h-28 rounded-md object-cover border" />
            ) : null}
          </div>
        </div>
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      </ModalForm>
      <ModalActions onCancel={onClose} onConfirm={submit} loading={loading} confirmText="Lưu" cancelText="Hủy" disabled={!name.trim()} />
    </ReusableModal>
  )
}


