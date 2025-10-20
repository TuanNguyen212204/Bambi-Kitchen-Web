import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { useDishStore } from "@zustand/stores/dish"
import type { DishCategory } from "@/models/category/category"

export default function AdminDishCategoryPage() {
  const { categories, fetchCategories, createCategory, updateCategory, removeCategory } = useDishStore()
  const [openAdd, setOpenAdd] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)
  const [loading, setLoading] = useState(false)

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
    if (!name.trim()) return
    setLoading(true)
    try {
      if (editingId) {
        await updateCategory({ id: editingId, name: name.trim(), description: description.trim() || undefined })
      } else {
        await createCategory({ name: name.trim(), description: description.trim() || undefined })
      }
      setOpenAdd(false)
      setEditingId(null)
      setName("")
      setDescription("")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: DishCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description || "")
    setOpenAdd(true)
  }

  const handleDelete = async (id: number) => {
    setLoading(true)
    try {
      await removeCategory(id)
      setConfirm(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Danh mục món</h1>
          <p className="text-gray-600 mt-1">Quản lý các danh mục món ăn trong hệ thống</p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700" 
          onClick={() => { setOpenAdd(true); setEditingId(null); setName(""); setDescription("") }}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Thêm danh mục"}
        </Button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh mục...</p>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có danh mục nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo danh mục món ăn đầu tiên</p>
          <Button 
            className="bg-orange-600 hover:bg-orange-700" 
            onClick={() => { setOpenAdd(true); setEditingId(null); setName(""); setDescription("") }}
          >
            Tạo danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Card key={c.id} className="border hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(c)}
                    disabled={loading}
                    className="flex-1"
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
                    disabled={loading}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReusableModal 
        open={openAdd} 
        onClose={() => { setOpenAdd(false); setEditingId(null); setName(""); setDescription("") }} 
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
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Mô tả
              </Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả cho danh mục (tùy chọn)..."
                disabled={loading}
                className="w-full"
              />
            </div>
          </div>
        </ModalForm>
        <ModalActions 
          onCancel={() => { setOpenAdd(false); setEditingId(null); setName(""); setDescription("") }} 
          onConfirm={submit}
          confirmText={editingId ? "Lưu thay đổi" : "Tạo danh mục"}
          cancelText="Hủy"
          loading={loading}
        />
      </ReusableModal>

      {confirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M8 6V4h8v2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold text-red-600">"{confirm.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tất cả món ăn trong danh mục này sẽ bị ảnh hưởng.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setConfirm(null)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700" 
                onClick={() => handleDelete(confirm.id)}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa danh mục"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


