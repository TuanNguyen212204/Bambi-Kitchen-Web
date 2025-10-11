import { useEffect, useState } from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useIngredientStore } from "@zustand/stores/ingredients"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"

interface Props { open: boolean; onClose: () => void }

export default function AddCategoryModal({ open, onClose }: Props) {
  const { categories, fetchCategories, createCategory } = useIngredientStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) fetchCategories() }, [open, fetchCategories])

  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
      setError("")
      setLoading(false)
    }
  }, [open])

  const submit = async () => {
    const NAME_RE = /^[\p{L}\p{N} ]+$/u
    if (!name.trim()) { setError("Tên danh mục là bắt buộc"); return }
    if (!NAME_RE.test(name.trim())) { setError("Tên chỉ gồm chữ/số và khoảng trắng"); return }
    
    setLoading(true)
    try {
      await createCategory({ name: name.trim(), description: description.trim() || undefined })
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
      title="Thêm danh mục nguyên liệu"
      size="md"
    >
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div>
          <Label className="mb-1 block">Tên danh mục</Label>
          <Input 
            value={name} 
            onChange={(e)=> { setName(e.target.value); setError("") }} 
            placeholder="VD: Thịt, Rau, Hải sản..." 
            className={error ? 'border-red-500' : ''}
          />
          {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
        </div>
        
        <div>
          <Label className="mb-1 block">Mô tả (tuỳ chọn)</Label>
          <Input 
            value={description} 
            onChange={(e)=> setDescription(e.target.value)} 
            placeholder="Mô tả ngắn" 
          />
        </div>
        
        <div className="max-h-32 overflow-auto border rounded p-2 text-sm">
          <div className="text-xs text-gray-500 mb-2">Danh mục hiện có:</div>
          {categories.map(c => (
            <div key={c.id} className="py-1">• {c.name}</div>
          ))}
        </div>
      </ModalForm>
      
      <ModalActions
        onCancel={onClose}
        onConfirm={submit}
        confirmText="Lưu"
        cancelText="Đóng"
        loading={loading}
        disabled={!name.trim()}
      />
    </ReusableModal>
  )
}


