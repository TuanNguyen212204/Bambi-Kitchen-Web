import { useEffect, useState } from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useDishStore } from "@zustand/stores/dish"
import type { DishCategoryCreateRequest } from "@/models/category/category"

interface Props { open: boolean; onClose: () => void }

export default function AddDishCategoryModal({ open, onClose }: Props) {
  const { createCategory } = useDishStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!open) {
      setName("")
      setDescription("")
      setLoading(false)
      setError("")
    }
  }, [open])

  const submit = async () => {
    setError("")
    if (!name.trim()) { 
      setError("Tên danh mục là bắt buộc")
      return 
    }
    setLoading(true)
    try {
      const payload: DishCategoryCreateRequest = {
        name: name.trim(),
        description: description.trim() || undefined
      }
      await createCategory(payload)
      onClose()
    } catch {
      setError("Có lỗi xảy ra khi tạo danh mục")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReusableModal open={open} onClose={onClose} title="Thêm danh mục món" size="md">
      <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Tên danh mục <span className="text-red-500">*</span>
            </Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={error ? 'border-red-500' : ''}
              placeholder="Nhập tên danh mục..."
              disabled={loading}
            />
            {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Mô tả (tùy chọn)
            </Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho danh mục..."
              disabled={loading}
            />
          </div>
        </div>
      </ModalForm>
      <ModalActions 
        onCancel={onClose} 
        onConfirm={submit} 
        loading={loading} 
        confirmText="Tạo danh mục" 
        cancelText="Hủy" 
        disabled={!name.trim() || loading} 
      />
    </ReusableModal>
  )
}


