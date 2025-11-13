import { useEffect, useRef, useState } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Switch } from "@components/ui/switch"
import { useIngredientStore } from "@zustand/stores/ingredients"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import type { Nutrition } from "@models/nutrition"
import {
  fetchIngredientNutrition,
  saveIngredientNutrition,
  type IngredientNutritionData,
} from "@services/nutrition.service"
import { extractErrorMessage } from "@utils/errors"

interface Props { 
  open: boolean; 
  onClose: () => void; 
  ingredient: { 
    id: number; 
    name: string; 
    unit?: string; 
    active?: boolean; 
    ingredient_category_id?: number; 
    category?: { id: number } | null; 
    imgUrl?: string;
    pricePerUnit?: number;
    quantity?: number;
    available?: number;
    reserve?: number;
    stock?: number;
  };
  nutrition?: Nutrition | null;
}

interface NutritionFormState {
  id?: number
  perUnit: string
  calories: string
  protein: string
  carb: string
  fat: string
  fiber: string
  sugar: string
  sodium: string
  calcium: string
  iron: string
}

const toInputString = (value?: number | null): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return ""
  }
  return value.toString()
}

const mapNutritionToFormState = (nutrition?: Nutrition | null): NutritionFormState => ({
  id: nutrition?.id,
  perUnit: nutrition?.per_unit?.trim() || "",
  calories: toInputString(nutrition?.calories),
  protein: toInputString(nutrition?.protein),
  carb: toInputString(nutrition?.carb),
  fat: toInputString((nutrition?.fat ?? nutrition?.sat_fat) ?? undefined),
  fiber: toInputString(nutrition?.fiber),
  sugar: toInputString(nutrition?.sugar),
  sodium: toInputString(nutrition?.sodium),
  calcium: toInputString(nutrition?.calcium),
  iron: toInputString(nutrition?.iron),
})

const normalizeFormState = (state: NutritionFormState): NutritionFormState => ({
  id: state.id,
  perUnit: state.perUnit.trim(),
  calories: state.calories.trim(),
  protein: state.protein.trim(),
  carb: state.carb.trim(),
  fat: state.fat.trim(),
  fiber: state.fiber.trim(),
  sugar: state.sugar.trim(),
  sodium: state.sodium.trim(),
  calcium: state.calcium.trim(),
  iron: state.iron.trim(),
})

const parseInputNumber = (value: string): number | undefined => {
  const trimmed = value.trim()
  if (trimmed === "") return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

const nutritionFieldLabels: Record<
  Exclude<keyof NutritionFormState, "id" | "perUnit">,
  string
> = {
  calories: "Calories (kcal)",
  protein: "Protein (g)",
  carb: "Carb (g)",
  fat: "Fat (g)",
  fiber: "Fiber (g)",
  sugar: "Sugar (g)",
  sodium: "Sodium (mg)",
  calcium: "Calcium (mg)",
  iron: "Iron (mg)",
}

export default function EditIngredientModal({ open, onClose, ingredient, nutrition }: Props) {
  const { categories, fetchCategories, update, adjustStock, toggleActive } = useIngredientStore()
  const [delta, setDelta] = useState<string>("0")
  const [name, setName] = useState(ingredient?.name ?? "")
  const [unit, setUnit] = useState(ingredient?.unit ?? "GRAM")
  const [active, setActive] = useState<boolean>(ingredient?.active ?? true)
  const [pricePerUnit, setPricePerUnit] = useState<string>(ingredient?.pricePerUnit?.toString() ?? "")
  const originalCategoryId = (
    ingredient.ingredient_category_id ??
    (ingredient as unknown as { categoryId?: number }).categoryId ??
    ingredient.category?.id ??
    undefined
  )
  const [categoryId, setCategoryId] = useState<number | undefined>(originalCategoryId)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [nameError, setNameError] = useState<string>("")
  const [deltaError, setDeltaError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [nutritionForm, setNutritionForm] = useState<NutritionFormState>(
    mapNutritionToFormState(nutrition)
  )
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionError, setNutritionError] = useState<string | null>(null)
  const nutritionInitialRef = useRef<NutritionFormState | null>(
    normalizeFormState(mapNutritionToFormState(nutrition))
  )

  const initializedRef = useRef(false)
  useEffect(() => {
    if (!open) { 
      initializedRef.current = false
      return 
    }
    if (!initializedRef.current) {
      initializedRef.current = true
      // Fetch categories một cách an toàn, không block render modal
      fetchCategories().catch((error) => {
        console.error("Error fetching categories:", error)
        // Không hiển thị toast error vì có thể categories đã được load từ page parent
      })
      setName(ingredient?.name ?? "")
      setUnit(ingredient?.unit ?? "GRAM")
      setActive(ingredient?.active ?? true)
      setPricePerUnit(ingredient?.pricePerUnit?.toString() ?? "")
      const cid = (
        ingredient.ingredient_category_id ??
        (ingredient as unknown as { categoryId?: number }).categoryId ??
        ingredient.category?.id
      )
      setCategoryId(typeof cid === 'number' ? cid : undefined)
      setSelectedFile(null)
      setPreviewUrl(null)
      setRemoveCurrentImage(false)
      setNameError("")
      setDeltaError("")
      setLoading(false)
      const initialNutrition = mapNutritionToFormState(nutrition)
      setNutritionForm(initialNutrition)
      nutritionInitialRef.current = normalizeFormState(initialNutrition)
      setNutritionError(null)
      setNutritionLoading(false)
    }
  }, [open, ingredient, nutrition, fetchCategories]) // reset khi ingredient hoặc dữ liệu dinh dưỡng thay đổi

  useEffect(() => {
    if (!open || !ingredient?.id) {
      return
    }
    let active = true
    const loadNutrition = async () => {
      setNutritionLoading(true)
      try {
        const data = await fetchIngredientNutrition(ingredient.id)
        if (!active) return
        const mapped = mapNutritionToFormState(data ?? nutrition ?? null)
        setNutritionForm(mapped)
        nutritionInitialRef.current = normalizeFormState(mapped)
        setNutritionError(null)
      } catch (error) {
        if (!active) return
        setNutritionError(
          extractErrorMessage(error) || "Không thể tải thông tin dinh dưỡng của nguyên liệu."
        )
        if (!nutrition) {
          const emptyState = mapNutritionToFormState(null)
          setNutritionForm(emptyState)
          nutritionInitialRef.current = normalizeFormState(emptyState)
        }
      } finally {
        if (active) setNutritionLoading(false)
      }
    }
    loadNutrition()
    return () => {
      active = false
    }
  }, [open, ingredient?.id, nutrition])

  const handleNutritionChange = (field: keyof NutritionFormState, value: string) => {
    setNutritionForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setNutritionError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 2MB.')
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    if (selectedFile) {
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } else if (ingredient.imgUrl) {
      setRemoveCurrentImage(true)
    }
  }

  const submit = async () => {
    if (!ingredient?.id) return
    const currentPricePerUnit = ingredient.pricePerUnit ?? undefined
    const priceValue = pricePerUnit.trim()
    const parsedPrice = priceValue === "" ? undefined : parseFloat(priceValue)
    const newPricePerUnit =
      parsedPrice !== undefined && !Number.isNaN(parsedPrice) ? parsedPrice : undefined
    const priceChanged = currentPricePerUnit !== newPricePerUnit

    const changedInfo =
      name !== (ingredient.name ?? "") ||
      unit !== (ingredient.unit ?? "GRAM") ||
      active !== (ingredient.active ?? true) ||
      typeof categoryId === "number" ||
      selectedFile !== null ||
      removeCurrentImage ||
      priceChanged

    setNameError("")
    setDeltaError("")
    setNutritionError(null)

    const NAME_RE = /^[\p{L}\p{N} ]+$/u
    if (!name.trim()) {
      setNameError("Tên nguyên liệu là bắt buộc")
      return
    }
    if (!NAME_RE.test(name.trim())) {
      setNameError("Tên chỉ gồm chữ/số và khoảng trắng")
      return
    }
    const DELTA_RE = /^-?\d+$/
    if (delta.trim() !== "" && !DELTA_RE.test(delta.trim())) {
      setDeltaError("Số điều chỉnh chỉ là số nguyên, có thể có 1 dấu trừ ở đầu")
      return
    }
    const deltaNum = Number(delta || 0)

    const normalizedNutrition = normalizeFormState(nutritionForm)
    const numericValues = {
      calories: parseInputNumber(normalizedNutrition.calories),
      protein: parseInputNumber(normalizedNutrition.protein),
      carb: parseInputNumber(normalizedNutrition.carb),
      fat: parseInputNumber(normalizedNutrition.fat),
      fiber: parseInputNumber(normalizedNutrition.fiber),
      sugar: parseInputNumber(normalizedNutrition.sugar),
      sodium: parseInputNumber(normalizedNutrition.sodium),
      calcium: parseInputNumber(normalizedNutrition.calcium),
      iron: parseInputNumber(normalizedNutrition.iron),
    }

    const numericKeys = Object.keys(numericValues) as Array<
      Exclude<keyof NutritionFormState, "id" | "perUnit">
    >
    const hasAnyNutritionValue =
      normalizedNutrition.perUnit !== "" ||
      numericKeys.some((key) => typeof numericValues[key] === "number")

    if (hasAnyNutritionValue && normalizedNutrition.perUnit === "") {
      setNutritionError("Vui lòng nhập đơn vị tham chiếu (ví dụ: per 100g) khi khai báo dinh dưỡng.")
      return
    }

    for (const key of numericKeys) {
      const raw = nutritionForm[key].trim()
      if (raw !== "" && typeof numericValues[key] !== "number") {
        setNutritionError(`${nutritionFieldLabels[key]} phải là số hợp lệ.`)
        return
      }
      if (typeof numericValues[key] === "number" && numericValues[key]! < 0) {
        setNutritionError(`${nutritionFieldLabels[key]} không được nhỏ hơn 0.`)
        return
      }
    }

    const normalizedInitial = nutritionInitialRef.current
    const nutritionChanged =
      hasAnyNutritionValue &&
      (!normalizedInitial ||
        JSON.stringify(normalizedNutrition) !== JSON.stringify(normalizedInitial))
    const shouldSaveNutrition = nutritionChanged

    setLoading(true)
    try {
      if (changedInfo) {
        const { bambiApi, API_ENDPOINTS } = await import("@/utils/api")
        let currentQuantity: number | undefined = undefined
        let currentReserve: number | undefined = undefined
        let currentPricePerUnitFromApi: number | undefined = undefined

        try {
          const currentRes = await bambiApi.get(API_ENDPOINTS.API_INGREDIENT_BY_ID(ingredient.id))
          const currentData = currentRes.data || {}
          currentQuantity =
            typeof (currentData as { quantity?: number }).quantity === "number"
              ? (currentData as { quantity?: number }).quantity!
              : undefined
          currentReserve =
            typeof (currentData as { reserve?: number }).reserve === "number"
              ? (currentData as { reserve?: number }).reserve!
              : undefined
          currentPricePerUnitFromApi =
            typeof (currentData as { pricePerUnit?: number }).pricePerUnit === "number"
              ? (currentData as { pricePerUnit?: number }).pricePerUnit!
              : undefined
        } catch (error) {
          console.error("Error fetching current ingredient:", error)
          currentQuantity =
            typeof ingredient.quantity === "number"
              ? ingredient.quantity
              : typeof ingredient.stock === "number"
              ? ingredient.stock
              : undefined
          currentReserve =
            typeof ingredient.reserve === "number" ? ingredient.reserve : undefined
          currentPricePerUnitFromApi =
            typeof ingredient.pricePerUnit === "number" ? ingredient.pricePerUnit : undefined
        }

        const calculatedAvailable =
          typeof currentQuantity === "number" && typeof currentReserve === "number"
            ? Math.max(0, currentQuantity - currentReserve)
            : typeof currentQuantity === "number" && currentQuantity >= 0
            ? currentQuantity
            : undefined

        const finalPricePerUnit =
          newPricePerUnit !== undefined ? newPricePerUnit : currentPricePerUnitFromApi

        await update({
          id: ingredient.id,
          name,
          unit,
          active,
          categoryId: typeof categoryId === "number" ? categoryId : originalCategoryId,
          file: selectedFile || undefined,
          removeImage: removeCurrentImage,
          pricePerUnit: finalPricePerUnit,
          quantity: currentQuantity,
          available: calculatedAvailable,
          reserve: currentReserve,
        })
      }

      if (deltaNum) {
        await adjustStock(ingredient.id, deltaNum)
      }

      let nutritionUpdated = false
      if (shouldSaveNutrition) {
        const payload: IngredientNutritionData = {
          id: nutritionForm.id,
          per_unit: normalizedNutrition.perUnit || undefined,
          calories: numericValues.calories,
          protein: numericValues.protein,
          carb: numericValues.carb,
          fiber: numericValues.fiber,
          sugar: numericValues.sugar,
          sodium: numericValues.sodium,
          calcium: numericValues.calcium,
          iron: numericValues.iron,
          fat: numericValues.fat,
          sat_fat: numericValues.fat,
        }

        try {
          const saved = await saveIngredientNutrition(ingredient.id, payload)
          const mapped = mapNutritionToFormState(saved)
          setNutritionForm(mapped)
          nutritionInitialRef.current = normalizeFormState(mapped)
          setNutritionError(null)
          nutritionUpdated = true
        } catch (error) {
          const message =
            extractErrorMessage(error) || "Cập nhật dinh dưỡng thất bại. Vui lòng thử lại."
          setNutritionError(message)
          toast.error(message)
          return
        }
      }

      if (!changedInfo && nutritionUpdated && !deltaNum) {
        toast.success("Đã cập nhật dinh dưỡng nguyên liệu")
      }

      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa nguyên liệu"
      size="lg"
      contentClassName="max-h-[80vh] overflow-y-auto"
    >
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tên nguyên liệu</Label>
          <Input 
            value={name} 
            onChange={(e)=> { setName(e.target.value); setNameError("") }} 
            className={nameError? 'border-red-500' : ''} 
          />
          {nameError && <div className="text-red-600 text-xs mt-1">{nameError}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Danh mục</Label>
          <select 
            className="w-full h-10 border rounded px-3" 
            value={categoryId ?? originalCategoryId ?? ""} 
            onChange={(e)=> setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            disabled={categories.length === 0}
          >
            {categories.length === 0 ? (
              <option value="">Đang tải danh mục...</option>
            ) : (
              categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
        </div>
        
        <div>
          <Label className="mb-1 block">Đơn vị</Label>
          <select 
            className="w-full h-10 border rounded px-3" 
            value={unit} 
            onChange={(e)=> setUnit(e.target.value)}
          >
            <option value="GRAM">GRAM</option>
            <option value="KILOGRAM">KILOGRAM</option>
            <option value="LITER">LITER</option>
            <option value="PCS">PCS</option>
          </select>
        </div>

        <div>
          <Label className="mb-1 block">Giá mỗi đơn vị (tùy chọn)</Label>
          <Input 
            type="number"
            step="0.01"
            min="0"
            value={pricePerUnit} 
            onChange={(e)=> setPricePerUnit(e.target.value)} 
            placeholder="VD: 50000" 
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Switch id="active" checked={active} onCheckedChange={async (checked)=>{ 
            setActive(checked)
            if (ingredient?.id) {
              try { await toggleActive(ingredient.id, checked) } catch { /* handled by store */ }
            }
          }} />
          <Label htmlFor="active">{active ? "Đang hoạt động" : "Không hoạt động"}</Label>
        </div>

        <div>
          <Label className="mb-1 block">Hình ảnh (tùy chọn)</Label>
          <div className="space-y-3">
            {!previewUrl && (!ingredient.imgUrl || removeCurrentImage) ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="edit-file-upload"
                />
                <label htmlFor="edit-file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Nhấp để chọn hình ảnh mới</p>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF (tối đa 2MB)</p>
                </label>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 overflow-hidden w-full">
                  <img 
                    src={previewUrl || (removeCurrentImage ? undefined : ingredient.imgUrl)} 
                    alt={ingredient.name}
                    className="w-12 h-12 object-cover rounded shrink-0" 
                  />
                  <div className="flex-1 w-0 overflow-hidden">
                    <p className="block text-sm font-medium text-gray-900 truncate whitespace-nowrap" title={selectedFile?.name || "Hình ảnh hiện tại"}>
                      {selectedFile?.name || "Hình ảnh hiện tại"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="edit-file-replace"
                    />
                    <label htmlFor="edit-file-replace">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Thông tin dinh dưỡng</div>
              <p className="text-xs text-gray-500">
                Dùng cho việc tính calories và phân tích sức khỏe món ăn.
              </p>
            </div>
            {nutritionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Per (ví dụ: per 100g)</Label>
              <Input
                value={nutritionForm.perUnit}
                onChange={(e) => handleNutritionChange("perUnit", e.target.value)}
                placeholder="per 100g"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Calories (kcal)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.calories}
                onChange={(e) => handleNutritionChange("calories", e.target.value)}
                placeholder="Ví dụ: 250"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Protein (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.protein}
                onChange={(e) => handleNutritionChange("protein", e.target.value)}
                placeholder="Ví dụ: 12.5"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Carb (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.carb}
                onChange={(e) => handleNutritionChange("carb", e.target.value)}
                placeholder="Ví dụ: 30"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Fat (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.fat}
                onChange={(e) => handleNutritionChange("fat", e.target.value)}
                placeholder="Ví dụ: 7.5"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Fiber (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.fiber}
                onChange={(e) => handleNutritionChange("fiber", e.target.value)}
                placeholder="Ví dụ: 4"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Sugar (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.sugar}
                onChange={(e) => handleNutritionChange("sugar", e.target.value)}
                placeholder="Tùy chọn"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Sodium (mg)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.sodium}
                onChange={(e) => handleNutritionChange("sodium", e.target.value)}
                placeholder="Tùy chọn"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Calcium (mg)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.calcium}
                onChange={(e) => handleNutritionChange("calcium", e.target.value)}
                placeholder="Tùy chọn"
                disabled={nutritionLoading || loading}
              />
            </div>
            <div>
              <Label className="mb-1 block">Iron (mg)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nutritionForm.iron}
                onChange={(e) => handleNutritionChange("iron", e.target.value)}
                placeholder="Tùy chọn"
                disabled={nutritionLoading || loading}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Để trống các trường không áp dụng. Hệ thống sẽ coi giá trị trống là 0.
          </p>
          {nutritionError ? (
            <div className="text-sm text-red-600">{nutritionError}</div>
          ) : null}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="font-medium">Điều chỉnh tồn kho</div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input 
                className={`w-40 pr-14 text-center ${deltaError? 'border-red-500' : ''}`} 
                type="text" 
                value={delta} 
                onChange={(e)=> { setDelta(e.target.value); setDeltaError("") }} 
                placeholder="0" 
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 select-none">
                {unit}
              </span>
            </div>
            <Button type="button" variant="outline" onClick={()=> setDelta("0")}>Reset</Button>
          </div>
          {deltaError && <div className="text-red-600 text-xs">{deltaError}</div>}
          <div className="text-xs text-gray-500">
            Nhập số dương để nhập kho, số âm để xuất kho. Việc điều chỉnh sẽ tạo giao dịch tồn kho và cập nhật tồn ngay sau khi bấm Lưu.
          </div>
        </div>
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Lưu"
        cancelText="Hủy"
        loading={loading}
        disabled={!name.trim()}
      />
    </ReusableModal>
  )
}


