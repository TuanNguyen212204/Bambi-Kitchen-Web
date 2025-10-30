import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { DeleteConfirmationModal } from "@components/ui/modal/DeleteConfirmationModal"
import { useIngredientStore } from "@zustand/stores/ingredients"
import { toast } from "sonner"

export default function AdminIngredientCategoryPage() {
  const { categories, fetchCategories, createCategory, updateCategory, removeCategory } = useIngredientStore()
  const ingredientStore = useIngredientStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => { 
    const loadCategories = async () => {
      setLoading(true)
      try {
        await fetchCategories()
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [fetchCategories])

  const submit = async () => {
    if (!name.trim()) {
      const { toast } = await import("sonner")
      toast.error("Vui lòng nhập tên danh mục")
      return
    }
    
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && cat.id !== editingId
    )
    
    if (isDuplicate) {
      const { toast } = await import("sonner")
      toast.error("Tên danh mục đã tồn tại")
      return
    }
    
    setLoading(true)
    try {
      if (editingId) {
        await updateCategory({ id: editingId, name: name.trim(), description: description.trim() || undefined })
      } else {
        await createCategory({ name: name.trim(), description: description.trim() || undefined })
      }
      setOpen(false)
      setEditingId(null)
      setName("")
      setDescription("")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: { id: number; name: string; description?: string }) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description || "")
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      if (!ingredientStore.items || ingredientStore.items.length === 0) {
        await ingredientStore.fetchAll?.()
      }
      const hasDependencies = (ingredientStore.items || []).some((ing) => {
        const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number; category?: { id?: number } }).categoryId
          ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
          ?? (ing as unknown as { category?: { id?: number } }).category?.id
        return catId === id
      })
      if (hasDependencies) {
        toast.error("Không thể xóa danh mục vì đang có nguyên liệu sử dụng. Hãy chuyển danh mục cho các nguyên liệu trước.")
        return
      }
    } catch {
      /* no-op */
    }
    setLoading(true)
    try {
      await removeCategory(id)
      setConfirm(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Danh mục nguyên liệu</h1>
          <p className="text-gray-600 mt-1">Quản lý các danh mục nguyên liệu trong hệ thống</p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700" 
          onClick={() => { setOpen(true); setEditingId(null); setName(""); setDescription("") }}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Thêm danh mục"}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Tìm kiếm danh mục</Label>
            <Input
              placeholder="Nhập tên hoặc mô tả danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredCategories.length} / {categories.length} danh mục
          </div>
        </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh mục...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "Không tìm thấy danh mục" : "Chưa có danh mục nào"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `Không có danh mục nào khớp với "${searchTerm}"`
              : "Bắt đầu bằng cách tạo danh mục nguyên liệu đầu tiên"
            }
          </p>
          <Button 
            className="bg-orange-600 hover:bg-orange-700" 
            onClick={() => { setOpen(true); setEditingId(null); setName(""); setDescription("") }}
          >
            Tạo danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((c) => {
            const numUsing = (ingredientStore.items || []).filter((ing) => {
              const catId = (ing as unknown as { categoryId?: number; ingredient_category_id?: number; category?: { id?: number } }).categoryId
                ?? (ing as unknown as { ingredient_category_id?: number }).ingredient_category_id
                ?? (ing as unknown as { category?: { id?: number } }).category?.id
              return catId === c.id
            }).length
            const canDelete = numUsing === 0
            return (
            <Card key={c.id} className="border hover:shadow-md transition-shadow duration-200 flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{c.name}</h3>
                </div>
                <div className="flex-1 mb-4">
                  {c.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">{c.description}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 shrink-0">{numUsing} nguyên liệu đang dùng</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(c)}
                      disabled={loading}
                      className="h-8 px-3 text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Sửa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setConfirm({ id: c.id, name: c.name })}
                      disabled={loading || !canDelete}
                      className="h-8 px-3 text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      {canDelete ? 'Xóa' : 'Không thể xóa'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      <ReusableModal 
        open={open} 
        onClose={() => { setOpen(false); setEditingId(null); setName(""); setDescription("") }} 
        title={editingId ? "Sửa danh mục" : "Thêm danh mục"}
        size="xl"
        contentClassName="sm:max-w-[480px] md:max-w-[640px] lg:max-w-[800px] max-h-[80vh] overflow-y-auto"
      >
        <ModalForm onSubmit={(e) => { e.preventDefault(); submit() }}>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Tên danh mục <span className="text-red-500">*</span>
              </Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                disabled={loading}
                className="w-full"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100 ký tự</p>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Mô tả
              </Label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả cho danh mục (tùy chọn)..."
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500 ký tự</p>
            </div>
          </div>
        </ModalForm>
        <ModalActions 
          onCancel={() => { setOpen(false); setEditingId(null); setName(""); setDescription("") }} 
          onConfirm={submit}
          confirmText={editingId ? "Lưu thay đổi" : "Tạo danh mục"}
          cancelText="Hủy"
          loading={loading}
        />
      </ReusableModal>

      <DeleteConfirmationModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) {
            try {
              await handleDelete(confirm.id);
              setConfirm(null);
            } catch (error) {
              console.error("Error deleting category:", error);
            }
          }
        }}
        title="Xác nhận xóa danh mục"
        itemName={confirm?.name || 'Không có tên'}
        itemType="danh mục"
      />
    </div>
  )
}


