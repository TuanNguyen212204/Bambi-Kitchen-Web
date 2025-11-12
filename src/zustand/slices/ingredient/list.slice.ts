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
        const raw = i as unknown as { 
          pricePerUnit?: number | string
          quantity?: number | string
          available?: number | string
          reserve?: number | string
          imgUrl?: string
          publicId?: string
          lastReserveAt?: string
          active?: boolean
        }
        const toNum = (v: unknown): number | undefined => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') {
            const n = Number(v)
            return Number.isFinite(n) ? n : undefined
          }
          return undefined
        }
        const quantity = toNum(raw.quantity) ?? toNum(raw.available)
        return { 
          ...(rest as Omit<Ingredient, "category">), 
          category: String(category ?? ""), 
          categoryId, 
          pricePerUnit: toNum(raw.pricePerUnit),
          quantity,
          available: toNum(raw.available),
          reserve: toNum(raw.reserve),
          imgUrl: raw.imgUrl || (rest as any).imgUrl,
          publicId: raw.publicId,
          lastReserveAt: raw.lastReserveAt,
          active: raw.active !== undefined ? raw.active : true,
        }
      })

      const transactionsRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
      const transactions = transactionsRes.data || []

      const withStock: StoreIngredient[] = normalized.map(ing => {
        let computedStock: number | undefined = typeof ing.quantity === 'number' ? ing.quantity : undefined

        if (typeof computedStock !== 'number') {
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
          computedStock = totalStock
        }

        const safeStock = typeof computedStock === 'number' ? computedStock : 0
        const isOut = safeStock <= 0
        const isLow = !isOut && safeStock <= 5
        const stockStatus: StockStatus = isOut ? "out" : isLow ? "low" : "normal"

        return { 
          ...ing, 
          stock: safeStock,
          stockStatus 
        }
      })

      set({ items: withStock, loading: false })
    } catch (error) {
      set({ loading: false })
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Không thể tải nguyên liệu")
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
        const catObj = (item as unknown as { category?: { name?: string; id?: number } }).category
        const category = typeof catObj === 'object' && catObj?.name ? String(catObj.name) : String((item as unknown as { category?: string }).category ?? "")
        const categoryId = typeof catObj === 'object' && typeof catObj?.id === 'number' ? Number(catObj.id) : undefined
        const { category: _omit2, ...rest } = item as Ingredient; void _omit2
        const raw = item as unknown as { 
          pricePerUnit?: number | string
          quantity?: number | string
          available?: number | string
          reserve?: number | string
          imgUrl?: string
          publicId?: string
          lastReserveAt?: string
          active?: boolean
        }
        const toNum = (v: unknown): number | undefined => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') { const n = Number(v); return Number.isFinite(n) ? n : undefined }
          return undefined
        }
        let computedStock = toNum(raw.quantity) ?? toNum(raw.available)
        if (typeof computedStock !== 'number') {
          try {
            const txRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
            const txs = (txRes.data || []).filter(t => t.ingredient && t.ingredient.id === (rest as Ingredient).id)
            let total = 0
            txs.forEach(t => { total += (t.transactionType === true ? 1 : -1) * (t.quantity || 0) })
            computedStock = total
          } catch { /* ignore */ }
        }
        const safeStock = typeof computedStock === 'number' ? computedStock : 0
        const isOut = safeStock <= 0
        const isLow = !isOut && safeStock <= 5
        const stockStatus: StockStatus = isOut ? "out" : isLow ? "low" : "normal"
        set({ items: [{ 
          ...(rest as Omit<Ingredient, "category">), 
          category, 
          categoryId, 
          stock: safeStock, 
          stockStatus, 
          quantity: toNum(raw.quantity), 
          available: toNum(raw.available), 
          reserve: toNum(raw.reserve), 
          pricePerUnit: toNum(raw.pricePerUnit),
          imgUrl: raw.imgUrl || (rest as any).imgUrl,
          publicId: raw.publicId,
          lastReserveAt: raw.lastReserveAt,
          active: raw.active !== undefined ? raw.active : true,
        }], loading: false })
      } else {
        set({ items: [], loading: false })
      }
    } catch (error) {
      set({ loading: false, items: [] })
      const { toast } = await import("sonner")
      const { extractErrorMessage } = await import("@utils/errors")
      toast.error(extractErrorMessage(error) || "Tìm kiếm thất bại")
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
