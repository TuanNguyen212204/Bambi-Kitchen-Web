import { useState, useEffect } from "react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useIngredientStore } from "@zustand/stores/ingredients"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

interface Props { open: boolean; onClose: () => void }

export default function AddIngredientModal({ open, onClose }: Props) {
  const { categories, fetchCategories, create } = useIngredientStore()
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("GRAM")
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [pricePerUnit, setPricePerUnit] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; category?: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) fetchCategories() }, [open, fetchCategories])

  useEffect(() => {
    if (!open) {
      setName("")
      setUnit("GRAM")
      setCategoryId(undefined)
      setPricePerUnit("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setErrors({})
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
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const submit = async () => {
    const e: { name?: string; category?: string } = {}
    const NAME_RE = /^[\p{L}\p{N} ]+$/u
    if (!name.trim()) e.name = "Tên nguyên liệu là bắt buộc"
    else if (!NAME_RE.test(name.trim())) e.name = "Tên chỉ gồm chữ/số và khoảng trắng"
    if (categoryId == null) e.category = "Vui lòng chọn danh mục"
    setErrors(e)
    if (Object.keys(e).length) return
    
    setLoading(true)
    try {
      const safeCategoryId = categoryId as number
      const priceValue = pricePerUnit.trim() ? parseFloat(pricePerUnit.trim()) : undefined
      await create({ name: name.trim(), categoryId: safeCategoryId, unit, pricePerUnit: priceValue, file: selectedFile || undefined })
      onClose()
    } catch {
      // Error handling is done in store
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Thêm nguyên liệu"
      size="md"
      contentClassName="max-h-[80vh] overflow-y-auto"
    >
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tên nguyên liệu</Label>
          <Input 
            value={name} 
            onChange={(e)=> setName(e.target.value)} 
            placeholder="VD: Thịt bò" 
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <div className="text-red-600 text-xs mt-1">{errors.name}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Danh mục</Label>
          <select 
            className={`w-full h-10 border rounded px-3 ${errors.category? 'border-red-500': ''}`} 
            value={categoryId ?? ""} 
            onChange={(e)=> setCategoryId(e.target.value === "" ? undefined : Number(e.target.value))}
          >
            <option value="">Chọn danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category && <div className="text-red-600 text-xs mt-1">{errors.category}</div>}
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

        <div>
          <Label className="mb-1 block">Hình ảnh (tùy chọn)</Label>
          <div className="space-y-3">
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Nhấp để chọn hình ảnh</p>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF (tối đa 2MB)</p>
                </label>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 overflow-hidden w-full">
                  <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded shrink-0" />
                  <div className="flex-1 w-0 overflow-hidden">
                    <p className="block text-sm font-medium text-gray-900 truncate whitespace-nowrap" title={selectedFile?.name || undefined}>{selectedFile?.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
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
            )}
          </div>
        </div>
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Tạo"
        cancelText="Hủy"
        loading={loading}
        disabled={!name.trim() || categoryId === undefined}
      />
    </ReusableModal>
  )
}


