import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { Ingredient } from "@models/ingredient/ingredient"

type StockStatus = "out" | "low" | "normal"
type StoreIngredient = Omit<Ingredient, "category"> & { category: string; stock?: number; stockStatus?: StockStatus; active?: boolean }
type IngredientDetail = { id?: number; entryDate?: string; expireDate?: string; quantity?: number; active?: boolean; ingredient?: { id: number } }

export interface IngredientState {
  items: StoreIngredient[]
  categories: { id: number; name: string; description?: string }[]
  loading: boolean
  query: string
  selectedCategoryId?: number
  statusFilter?: "all" | "active" | "inactive"
  stockFilter?: "all" | "out" | "low" | "normal"
  viewMode: "grid" | "list"
  sortBy: "priority" | "name_asc" | "name_desc" | "stock_asc" | "stock_desc"

  fetchAll: () => Promise<void>
  searchByName: (name: string) => Promise<void>
  fetchCategories: () => Promise<void>
  createCategory: (payload: { name: string; description?: string }) => Promise<{ id: number; name: string; description?: string } | undefined>
  create: (payload: { name: string; categoryId: number; unit: string }) => Promise<void>
  update: (payload: { id: number; name: string; categoryId?: number; unit?: string; active?: boolean }) => Promise<void>
  remove: (id: number) => Promise<void>
  adjustStock: (ingredientId: number, delta: number) => Promise<void>


  setQuery: (q: string) => void
  setSelectedCategoryId: (id?: number) => void
  setStatusFilter: (s: "all" | "active" | "inactive") => void
  setStockFilter: (s: "all" | "out" | "low" | "normal") => void
  setViewMode: (m: "grid" | "list") => void
  setSortBy: (s: IngredientState["sortBy"]) => void
  filteredItems: () => StoreIngredient[]
}

export const useIngredientStore = create<IngredientState>()(
  subscribeWithSelector(
    devtools((set, get) => ({
      items: [],
      categories: [],
      loading: false,
      query: "",
      selectedCategoryId: undefined,
      statusFilter: "all",
      stockFilter: "all",
      viewMode: "grid",
      sortBy: "priority",

      fetchAll: async () => {
        set({ loading: true })
        try {
          const res = await bambiApi.get<Ingredient[]>(API_ENDPOINTS.API_INGREDIENTS)

          const normalized: StoreIngredient[] = res.data.map((i) => {
            const cat: unknown = (i as unknown as { category?: unknown }).category
            let category: string | unknown = cat as unknown
            if (cat && typeof cat === "object" && (cat as { name?: unknown }).name) {
              category = String((cat as { name?: unknown }).name)
            }
            const { category: _omit1, ...rest } = i as Ingredient; void _omit1
            return { ...(rest as Omit<Ingredient, "category">), category: String(category ?? "") }
          })

          const withStock: StoreIngredient[] = []
          for (const ing of normalized) {
            try {
              const details = await bambiApi.get<IngredientDetail[]>(API_ENDPOINTS.API_INGREDIENT_DETAILS_BY_INGREDIENT(ing.id))
              const now = Date.now()
              const valid = (details.data || []).filter((d) => !d.expireDate || new Date(d.expireDate).getTime() > now)
              const stock = (valid as IngredientDetail[]).reduce((sum: number, d) => sum + (Number(d.quantity) || 0), 0)

              const isOut = stock <= 0
              const isLow = !isOut && stock <= 5
              const stockStatus: StockStatus = isOut ? "out" : isLow ? "low" : "normal"
              withStock.push({ ...ing, stock, stockStatus })
            } catch {
              withStock.push({ ...ing, stock: undefined, stockStatus: "normal" })
            }
          }
          set({ items: withStock, loading: false })
        } catch {
          set({ loading: false })
          toast.error("Không thể tải nguyên liệu")
        }
      },

      searchByName: async (name: string) => {
        set({ loading: true, query: name })
        try {
          const res = await bambiApi.get<Ingredient>(API_ENDPOINTS.API_INGREDIENT_SEARCH_BY_NAME(name), { headers: { "x-silent-error": "1" } })
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
          toast.error("Tìm kiếm thất bại")
        }
      },

      fetchCategories: async () => {
        try {
          const res = await bambiApi.get<{ id: number; name: string; description?: string }[]>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES)
          set({ categories: res.data })
        } catch {
          toast.error("Không thể tải danh mục")
        }
      },

      createCategory: async (payload) => {
        try {
          const res = await bambiApi.post<{ id: number; name: string; description?: string }>(API_ENDPOINTS.API_INGREDIENT_CATEGORIES, payload)
          set((state) => ({ categories: [res.data, ...state.categories] })) 
          toast.success("Đã tạo danh mục")
          return res.data
        } catch {
          toast.error("Tạo danh mục thất bại")
          return undefined
        }
      },

      create: async (payload) => {
        try {
          const res = await bambiApi.post<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, payload)
          const created = res.data
          const catObj = (created as unknown as { category?: { name?: string } }).category
          const category = typeof catObj === 'object' && catObj?.name ? String(catObj.name) : String((created as unknown as { category?: string }).category ?? "")
          const { category: _omit3, ...rest } = created as Ingredient; void _omit3
          set({ items: [{ ...(rest as Omit<Ingredient, "category">), category }, ...get().items] })
          toast.success("Đã thêm nguyên liệu")
        } catch {
          toast.error("Thêm nguyên liệu thất bại")
        }
      },

      update: async (payload) => {
        try {
          const res = await bambiApi.put<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, payload)
          set({
            items: get().items.map((i) => (i.id === res.data.id ? { ...i, ...res.data } as StoreIngredient : i)),
          })
          toast.success("Đã cập nhật nguyên liệu")
        } catch {
          toast.error("Cập nhật nguyên liệu thất bại")
        }
      },

      remove: async (id: number) => {
        try {
          await bambiApi.delete<string>(API_ENDPOINTS.API_INGREDIENT_BY_ID(id))
          set({ items: get().items.filter((i) => i.id !== id) })
          toast.success("Đã xóa nguyên liệu")
        } catch {
          toast.error("Xóa nguyên liệu thất bại")
        }
      },

      adjustStock: async (ingredientId, delta) => {
        if (!delta) return
        try {

          const txPayload = { id: 0, ingredient: { id: ingredientId } as unknown as Ingredient, quantity: Math.abs(delta), transactionType: delta > 0 }
          await bambiApi.post(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS, txPayload)

          if (delta > 0) {
            const nowIso = new Date().toISOString()
            const expireIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            const detailPayload: Partial<IngredientDetail> & { ingredient: { id: number } } = {
              ingredient: { id: ingredientId },
              entryDate: nowIso,
              expireDate: expireIso,
              quantity: delta,
              active: true,
            }
            await bambiApi.post(API_ENDPOINTS.API_INGREDIENT_DETAILS, detailPayload as unknown as IngredientDetail)
          } else {
            let remaining = Math.abs(delta)
            const resp = await bambiApi.get<IngredientDetail[]>(API_ENDPOINTS.API_INGREDIENT_DETAILS_BY_INGREDIENT(ingredientId))
            const fifo = [...(resp.data || [])]
              .filter((d) => (Number(d.quantity) || 0) > 0)
              .sort((a, b) => new Date(a.entryDate || 0).getTime() - new Date(b.entryDate || 0).getTime())

            for (const d of fifo) {
              if (!remaining) break
              const currentQty = Number(d.quantity) || 0
              const used = Math.min(currentQty, remaining)
              const newQty = currentQty - used
              remaining -= used
              if (d.id == null) continue

              const updateDetail: IngredientDetail = {
                id: d.id,
                ingredient: { id: ingredientId },
                entryDate: d.entryDate,
                expireDate: d.expireDate,
                quantity: Math.max(0, newQty),
                active: d.active !== false,
              }

              if (newQty === 0) {
                try {
                  await bambiApi.delete(API_ENDPOINTS.API_INGREDIENT_DETAIL_BY_ID(d.id))
                } catch {
                  await bambiApi.put(API_ENDPOINTS.API_INGREDIENT_DETAILS, updateDetail)
                }
              } else {
                await bambiApi.put(API_ENDPOINTS.API_INGREDIENT_DETAILS, updateDetail)
              }
            }
          }

          const details = await bambiApi.get<IngredientDetail[]>(API_ENDPOINTS.API_INGREDIENT_DETAILS_BY_INGREDIENT(ingredientId))
          const now = Date.now()
          const valid = (details.data || []).filter((d) => !d.expireDate || new Date(d.expireDate).getTime() > now)
          const stock = (valid as IngredientDetail[]).reduce((sum: number, d) => sum + (Number(d.quantity) || 0), 0)
          const isOut = stock <= 0
          const isLow = !isOut && stock <= 5
          const stockStatus: StockStatus = isOut ? "out" : isLow ? "low" : "normal"
          set({ items: get().items.map(i => i.id === ingredientId ? { ...i, stock, stockStatus } : i) })
          toast.success("Đã cập nhật tồn kho")
        } catch {
          toast.error("Cập nhật tồn kho thất bại")
        }
      },

      setQuery: (q: string) => set({ query: q }),
      setSelectedCategoryId: (id?: number) => set({ selectedCategoryId: id }),
      setStatusFilter: (s: "all" | "active" | "inactive") => set({ statusFilter: s }),
      setStockFilter: (s: "all" | "out" | "low" | "normal") => set({ stockFilter: s }),
      setViewMode: (m: "grid" | "list") => set({ viewMode: m }),
      setSortBy: (s: IngredientState["sortBy"]) => set({ sortBy: s }),

      filteredItems: () => {
        const { items, categories, selectedCategoryId, statusFilter, stockFilter, query, sortBy } = get()
        let data: StoreIngredient[] = [...items]
        if (query.trim()) {
          const q = query.toLowerCase()
          data = data.filter((i) => i.name.toLowerCase().includes(q))
        }
        if (selectedCategoryId) {
          const cat = categories.find((c) => c.id === selectedCategoryId)?.name
          if (cat) data = data.filter((i) => String(i.category ?? "") === cat)
        }
        if (statusFilter && statusFilter !== "all") {
          const active = statusFilter === "active"
          data = data.filter((i) => (i.active ?? true) === active)
        }
        if (stockFilter && stockFilter !== "all") {
          data = data.filter((i) => i.stockStatus === stockFilter)
        }

        const priorityRank = (s?: string) => (s === "out" ? 0 : s === "low" ? 1 : 2)
        data.sort((a, b) => {
          if (sortBy === "name_asc") return a.name.localeCompare(b.name)
          if (sortBy === "name_desc") return b.name.localeCompare(a.name)
          if (sortBy === "stock_asc") return (a.stock ?? Number.MAX_SAFE_INTEGER) - (b.stock ?? Number.MAX_SAFE_INTEGER)
          if (sortBy === "stock_desc") return (b.stock ?? -1) - (a.stock ?? -1)
          const pr = priorityRank(a.stockStatus) - priorityRank(b.stockStatus)
          if (pr !== 0) return pr
          const sc = (a.stock ?? Number.MAX_SAFE_INTEGER) - (b.stock ?? Number.MAX_SAFE_INTEGER)
          if (sc !== 0) return sc
          return a.name.localeCompare(b.name)
        })
        return data
      },
    }))
  )
)


