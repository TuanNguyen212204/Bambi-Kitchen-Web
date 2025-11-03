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
      const currentState = get() as unknown as { update?: (payload: { id: number; name: string; quantity?: number; available?: number; reserve?: number; unit?: string; active?: boolean; categoryId?: number; pricePerUnit?: number; silent?: boolean }) => Promise<void> }
      // Lấy lại metadata của ingredient để điền đủ params cho update
      const ingredientRes = await bambiApi.get(API_ENDPOINTS.API_INGREDIENT_BY_ID(ingredientId))
      const currentIngredient = ingredientRes.data || {}
      
      // Tính toán available = quantity - reserve
      // reserve có thể từ API response hoặc từ store hiện tại
      const currentReserve = typeof (currentIngredient as { reserve?: number }).reserve === 'number' 
        ? (currentIngredient as { reserve?: number }).reserve!
        : (typeof (currentIngredient as unknown as { reserve?: number }).reserve === 'number'
          ? (currentIngredient as unknown as { reserve?: number }).reserve!
          : 0)
      
      // available = quantity - reserve (số lượng có sẵn = tổng số lượng - số đã reserve)
      const newAvailable = Math.max(0, newQuantity - currentReserve)
      
      if (currentState.update) {
        await currentState.update({
          id: ingredientId,
          name: (currentIngredient as { name?: string }).name || '',
          quantity: newQuantity,
          available: newAvailable, // Tự động tính toán available khi cập nhật quantity
          reserve: currentReserve, // Giữ nguyên reserve
          unit: (currentIngredient as { unit?: string }).unit || 'GRAM',
          active: (currentIngredient as { active?: boolean }).active !== undefined ? (currentIngredient as { active?: boolean }).active! : true,
          categoryId: (currentIngredient as { category?: { id?: number } }).category?.id || (currentIngredient as unknown as { categoryId?: number }).categoryId,
          // Giữ nguyên đơn giá để tránh bị BE set về 0 nếu không truyền
          pricePerUnit: typeof (currentIngredient as { pricePerUnit?: number }).pricePerUnit === 'number'
            ? (currentIngredient as { pricePerUnit?: number }).pricePerUnit!
            : undefined,
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
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Cập nhật tồn kho thất bại")
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
