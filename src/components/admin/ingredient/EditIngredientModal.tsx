import { useEffect, useRef, useState } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Switch } from "@components/ui/switch"
import { useIngredientStore } from "@zustand/stores/ingredients"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

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
  } 
}

export default function EditIngredientModal({ open, onClose, ingredient }: Props) {
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

  const initializedRef = useRef(false)
  useEffect(() => {
    if (!open) { initializedRef.current = false; return }
    if (!initializedRef.current) {
      initializedRef.current = true
      fetchCategories()
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
    }
  }, [open])

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
    const changedInfo =
      name !== (ingredient.name ?? "") ||
      unit !== (ingredient.unit ?? "GRAM") ||
      active !== (ingredient.active ?? true) ||
      typeof categoryId === "number" ||
      selectedFile !== null ||
      removeCurrentImage

    try {
      setNameError("")
      setDeltaError("")
      const NAME_RE = /^[\p{L}\p{N} ]+$/u
      if (!name.trim()) { setNameError("Tên nguyên liệu là bắt buộc"); return }
      if (!NAME_RE.test(name.trim())) { setNameError("Tên chỉ gồm chữ/số và khoảng trắng"); return }
      const DELTA_RE = /^-?\d+$/
      if (delta.trim() !== "" && !DELTA_RE.test(delta.trim())) { setDeltaError("Số điều chỉnh chỉ là số nguyên, có thể có 1 dấu trừ ở đầu"); return }
      const deltaNum = Number(delta || 0)
      
      setLoading(true)
      if (changedInfo) {
        await update({ 
          id: ingredient.id, 
          name, 
          unit, 
          active, 
          categoryId: typeof categoryId === 'number' ? categoryId : originalCategoryId, 
          file: selectedFile || undefined,
          removeImage: removeCurrentImage
        })
      }
      if (deltaNum) {
        await adjustStock(ingredient.id, deltaNum)
      }
      onClose()
    } catch {
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
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
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
          <Label htmlFor="active">Đang hoạt động</Label>
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


