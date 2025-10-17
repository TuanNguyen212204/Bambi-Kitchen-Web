import type { StateCreator } from "zustand"
import type { IngredientListSlice, StoreIngredient, InventoryTransaction, StockStatus } from "@/zustand/types"
import type { Ingredient } from "@models/ingredient/ingredient"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createIngredientListSlice: StateCreator<IngredientListSlice, [], [], IngredientListSlice> = (set, get, _store) => ({
  items: [],
  loading: false,
  query: "",
  
  setQuery: (query) => set({ query }),
  
  fetchAll: async () => {
    set({ loading: true })
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.get<Ingredient[]>(API_ENDPOINTS.API_INGREDIENTS)
      

      const normalized: StoreIngredient[] = res.data.map((i) => {
        const cat: unknown = (i as unknown as { category?: unknown }).category
        let category: string | unknown = cat as unknown
        let categoryId: number | undefined = undefined
        if (cat && typeof cat === "object") {
          const c = cat as { name?: unknown; id?: unknown }
          if (c.name) category = String(c.name)
          if (typeof c.id === 'number') categoryId = c.id as number
        }
        const { category: _omit1, ...rest } = i as Ingredient; void _omit1
        return { ...(rest as Omit<Ingredient, "category">), category: String(category ?? ""), categoryId }
      })

      const transactionsRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
      const transactions = transactionsRes.data || []

      const withStock: StoreIngredient[] = normalized.map(ing => {
        const ingredientTransactions = transactions.filter(t => 
          t.ingredient && t.ingredient.id === ing.id
        )
        
        let totalStock = 0
        ingredientTransactions.forEach(t => {
          if (t.transactionType === true) { 
            totalStock += t.quantity || 0
          } else { 
            totalStock -= t.quantity || 0
          }
        })

        const isOut = totalStock <= 0
        const isLow = !isOut && totalStock <= 5
        const stockStatus: StockStatus = isOut ? "out" : isLow ? "low" : "normal"

        return { 
          ...ing, 
          stock: totalStock,
          stockStatus 
        }
      })

      set({ items: withStock, loading: false })
    } catch {
      set({ loading: false })
      const { toast } = await import("sonner")
      toast.error("Không thể tải nguyên liệu")
    }
  },

  searchByName: async (name: string) => {
    set({ loading: true, query: name })
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api")
      const res = await bambiApi.get<Ingredient>(API_ENDPOINTS.API_INGREDIENT_SEARCH_BY_NAME(name), { 
        headers: { "x-silent-error": "1" } 
      })
      const item = res.data
      if (item) {
        const catObj = (item as unknown as { category?: { name?: string } }).category
        const category = typeof catObj === 'object' && catObj?.name ? String(catObj.name) : String((item as unknown as { category?: string }).category ?? "")
        const { category: _omit2, ...rest } = item as Ingredient; void _omit2
        set({ items: [{ ...(rest as Omit<Ingredient, "category">), category }], loading: false })
      } else {
        set({ items: [], loading: false })
      }
    } catch {
      set({ loading: false, items: [] })
      const { toast } = await import("sonner")
      toast.error("Tìm kiếm thất bại")
    }
  },

  filteredItems: () => {
    const state = get()
    let filtered = state.items

    if (state.query) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(state.query.toLowerCase())
      )
    }

    return filtered
  },
})
