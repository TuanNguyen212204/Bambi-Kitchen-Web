import type { StateCreator } from "zustand"
import type { IngredientStockSlice, InventoryTransaction } from "@/zustand/types"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientStockSlice: StateCreator<IngredientStockSlice, [], [], IngredientStockSlice> = (_set, get, _store) => ({
  adjustStock: async (ingredientId, delta) => {
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      await bambiApi.post(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS, {
        ingredient: { id: ingredientId },
        quantity: Math.abs(delta),
        transactionType: delta > 0
      })
      
      // Refresh the ingredient list to get updated stock
      const currentState = get() as unknown as { fetchAll?: () => Promise<void> }
      if (currentState.fetchAll) {
        await currentState.fetchAll()
      }
      
      const { toast } = await import("sonner")
      toast.success(delta > 0 ? "Đã thêm tồn kho" : "Đã trừ tồn kho")
    } catch {
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
