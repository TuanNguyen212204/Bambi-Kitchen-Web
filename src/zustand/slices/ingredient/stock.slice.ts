import type { StateCreator } from "zustand"
import type { IngredientStockSlice, InventoryTransaction } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientStockSlice: StateCreator<IngredientStockSlice, [], [], IngredientStockSlice> = (_set, get, _store) => ({
  adjustStock: async (ingredientId, delta) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      
      // Tạo transaction
      await bambiApi.post(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS, {
        ingredient: { id: ingredientId },
        quantity: Math.abs(delta),
        transactionType: delta > 0,
      })
      
      // Tính lại tồn kho thực tế từ danh sách transactions (tránh phụ thuộc vào field quantity trên BE)
      const txRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
      const txs = (txRes.data || []).filter(t => t.ingredient && t.ingredient.id === ingredientId)
      let recalculatedStock = 0
      txs.forEach(t => {
        if (t.transactionType === true) recalculatedStock += t.quantity || 0
        else recalculatedStock -= t.quantity || 0
      })
      const newQuantity = Math.max(0, recalculatedStock)
      
      // Cập nhật quantity của ingredient bằng cách gọi update function
      const currentState = get() as unknown as { update?: (payload: { id: number; name: string; quantity?: number; unit?: string; active?: boolean; categoryId?: number; silent?: boolean }) => Promise<void> }
      // Lấy lại metadata của ingredient để điền đủ params cho update
      const ingredientRes = await bambiApi.get(API_ENDPOINTS.API_INGREDIENT_BY_ID(ingredientId))
      const currentIngredient = ingredientRes.data || {}
      if (currentState.update) {
        await currentState.update({
          id: ingredientId,
          name: (currentIngredient as { name?: string }).name || '',
          quantity: newQuantity,
          unit: (currentIngredient as { unit?: string }).unit || 'GRAM',
          active: (currentIngredient as { active?: boolean }).active !== undefined ? (currentIngredient as { active?: boolean }).active! : true,
          categoryId: (currentIngredient as { category?: { id?: number } }).category?.id || (currentIngredient as unknown as { categoryId?: number }).categoryId,
          silent: true,
        })
      }
      
      // Refresh the ingredient list to get updated stock
      const fetchState = get() as unknown as { fetchAll?: () => Promise<void> }
      if (fetchState.fetchAll) {
        await fetchState.fetchAll()
      }
      
      const { toast } = await import("sonner")
      toast.success(delta > 0 ? "Đã thêm tồn kho" : "Đã trừ tồn kho")
    } catch (error) {
      console.error("Adjust stock error:", error)
      const { toast } = await import("sonner")
      toast.error("Cập nhật tồn kho thất bại")
    }
  },

  getStockHistory: async (ingredientId) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
      return res.data.filter(t => t.ingredient && t.ingredient.id === ingredientId)
    } catch {
      return []
    }
  },
})
