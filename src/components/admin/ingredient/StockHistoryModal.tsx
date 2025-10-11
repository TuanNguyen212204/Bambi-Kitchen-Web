import { useEffect, useState } from "react"
import { useIngredientStore } from "@zustand/stores/ingredients"
import ReusableModal from "@components/ui/modal/modal"

interface Props { 
  open: boolean
  onClose: () => void
  ingredient: { id: number; name: string; unit?: string }
}

export default function StockHistoryModal({ open, onClose, ingredient }: Props) {
  const { getStockHistory } = useIngredientStore()
  const [transactions, setTransactions] = useState<Array<{
    id: number
    ingredient: { id: number }
    orders?: { id: number }
    createAt: string
    quantity: number
    transactionType: boolean
  }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && ingredient.id) {
      setLoading(true)
      getStockHistory(ingredient.id).then(data => {
        setTransactions(data)
        setLoading(false)
      })
    }
  }, [open, ingredient.id, getStockHistory])

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title={`Lịch sử tồn kho - ${ingredient.name}`}
      size="2xl"
      contentClassName="max-h-[80vh] overflow-hidden"
    >
      <div className="overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có giao dịch tồn kho
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tx.transactionType ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.transactionType ? 'Nhập kho' : 'Xuất kho'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Số lượng: {tx.quantity} {ingredient.unit || ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {tx.orders && (
                    <div className="text-xs text-gray-500">
                      Đơn hàng: #{tx.orders.id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReusableModal>
  )
}
