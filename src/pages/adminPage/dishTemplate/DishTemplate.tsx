import { useEffect, useState } from "react"
import { Card, CardContent } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { useDishStore } from "@zustand/stores/dish"
import ReusableModal, { ModalForm, ModalActions } from "@components/ui/modal/modal"
import { TrashIcon } from "lucide-react"
import type { DishTemplateItem } from "@zustand/slices/dish/template.slice"

type SizeCode = "S" | "M" | "L"

export default function AdminDishTemplatePage() {
  const store = useDishStore()
  const { templates, fetchTemplates, upsertTemplate, removeTemplate } = store
  const [editing, setEditing] = useState<DishTemplateItem | null>(null)
  const [deleting, setDeleting] = useState<DishTemplateItem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { 
    const loadTemplates = async () => {
      setLoading(true)
      try {
        await fetchTemplates()
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [fetchTemplates])

  const upsert = async () => {
    if (!editing) return
    
    if (!editing.name.trim()) {
      const { toast } = await import("sonner")
      toast.error("Vui lòng nhập tên mẫu tô")
      return
    }
    
    if (editing.priceRatio <= 0) {
      const { toast } = await import("sonner")
      toast.error("Tỷ lệ giá phải lớn hơn 0")
      return
    }
    
    if (editing.quantityRatio <= 0) {
      const { toast } = await import("sonner")
      toast.error("Tỷ lệ số lượng phải lớn hơn 0")
      return
    }
    
    setLoading(true)
    try {
      await upsertTemplate(editing)
      setEditing(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setLoading(true)
    try {
      await removeTemplate(deleting.size)
      setDeleting(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-[28px]">Mẫu tô</h1>
          <p className="text-gray-600 mt-1">Quản lý các mẫu tô với kích cỡ và tỷ lệ khác nhau</p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700" 
          onClick={() => setEditing({ size: "S", name: "Small", priceRatio: 1, quantityRatio: 1 })}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Thêm mẫu tô"}
        </Button>
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải mẫu tô...</p>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có mẫu tô nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo mẫu tô đầu tiên</p>
          <Button 
            className="bg-orange-600 hover:bg-orange-700" 
            onClick={() => setEditing({ size: "S", name: "Small", priceRatio: 1, quantityRatio: 1 })}
          >
            Tạo mẫu tô đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.size} className="border hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{t.name} ({t.size})</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                        Tỷ lệ giá: {t.priceRatio}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        Tỷ lệ số lượng: {t.quantityRatio}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditing(t)}
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
                    onClick={() => setDeleting(t)}
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

      {editing && (
        <ReusableModal
          open={true}
          onClose={() => setEditing(null)}
          title="Chỉnh sửa mẫu tô"
          size="xl"
          contentClassName="sm:max-w-[560px] md:max-w-[720px] lg:max-w-[960px] max-h-[80vh] overflow-y-auto"
        >
          <ModalForm onSubmit={(e) => { e.preventDefault(); upsert() }}>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                  Kích cỡ <span className="text-red-500">*</span>
                </Label>
                <select 
                  className="w-full h-10 border rounded px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  value={editing.size} 
                  onChange={(e) => setEditing({ ...editing, size: e.target.value as SizeCode })}
                  disabled={loading}
                >
                  <option value="S">S - Nhỏ</option>
                  <option value="M">M - Vừa</option>
                  <option value="L">L - Lớn</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                  Tên hiển thị <span className="text-red-500">*</span>
                </Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Nhập tên hiển thị..."
                  disabled={loading}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{editing.name.length}/50 ký tự</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Tỷ lệ giá <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    value={editing.priceRatio} 
                    onChange={(e) => setEditing({ ...editing, priceRatio: Number(e.target.value) })}
                    placeholder="1.0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tỷ lệ giá so với mẫu chuẩn</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Tỷ lệ số lượng <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    value={editing.quantityRatio} 
                    onChange={(e) => setEditing({ ...editing, quantityRatio: Number(e.target.value) })}
                    placeholder="1.0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tỷ lệ số lượng so với mẫu chuẩn</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Tối đa Carb
                  </Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editing.max_Carb || 0} 
                    onChange={(e) => setEditing({ ...editing, max_Carb: Number(e.target.value) })}
                    placeholder="0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Số lượng tối đa (tùy chọn)</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Tối đa Protein
                  </Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editing.max_Protein || 0} 
                    onChange={(e) => setEditing({ ...editing, max_Protein: Number(e.target.value) })}
                    placeholder="0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Số lượng tối đa (tùy chọn)</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium text-gray-700">
                    Tối đa Rau củ
                  </Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editing.max_Vegetable || 0} 
                    onChange={(e) => setEditing({ ...editing, max_Vegetable: Number(e.target.value) })}
                    placeholder="0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Số lượng tối đa (tùy chọn)</p>
                </div>
              </div>
            </div>
          </ModalForm>
          <ModalActions 
            onCancel={() => setEditing(null)} 
            onConfirm={upsert} 
            confirmText="Lưu thay đổi" 
            cancelText="Hủy"
            loading={loading}
          />
        </ReusableModal>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ marginTop: 0 }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa mẫu tô <span className="font-semibold text-red-600">"{deleting.name} ({deleting.size})"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tất cả dữ liệu liên quan đến mẫu tô này sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleting(null)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700" 
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa mẫu tô"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


