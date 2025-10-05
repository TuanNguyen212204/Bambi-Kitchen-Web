import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { toast } from "sonner"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { Ingredient } from "@models/ingredient/ingredient"

const validateFileSize = (file: File): boolean => {
  return file.size <= 2 * 1024 * 1024
}

const resizeImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      let { width, height } = img
    
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(resizedFile)
        } else {
          reject(new Error('Canvas to blob conversion failed'))
        }
      }, 'image/jpeg', quality)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}


type StockStatus = "out" | "low" | "normal"
type StoreIngredient = Omit<Ingredient, "category"> & { category: string; stock?: number; stockStatus?: StockStatus; active?: boolean }

interface InventoryTransaction {
  id: number
  ingredient: { id: number }
  orders?: { id: number }
  createAt: string
  quantity: number
  transactionType: boolean
}

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
          create: (payload: { name: string; categoryId: number; unit: string; file?: File }) => Promise<void>
          update: (payload: { id: number; name: string; categoryId?: number; unit?: string; active?: boolean; file?: File; removeImage?: boolean }) => Promise<void>
  remove: (id: number) => Promise<void>
  adjustStock: (ingredientId: number, delta: number) => Promise<void>
  getStockHistory: (ingredientId: number) => Promise<InventoryTransaction[]>

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
              const formData = new FormData()
              formData.append('name', payload.name)
              formData.append('categoryId', payload.categoryId.toString())
              formData.append('unit', payload.unit)
              
              if (payload.file) {
                if (!validateFileSize(payload.file)) {
                  toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 2MB.')
                  return
                }
                const resizedFile = await resizeImage(payload.file)
                formData.append('file', resizedFile)
              }

              const res = await bambiApi.post<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
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
              if (!payload.file) {
                const currentIngredient = get().items.find(i => i.id === payload.id)
                const categoryIdToUse = payload.categoryId !== undefined ? payload.categoryId : ((currentIngredient as unknown as { categoryId?: number })?.categoryId || 1)
                
                const ingredientData: Record<string, unknown> = {
                  name: payload.name,
                  categoryId: categoryIdToUse,
                  unit: payload.unit,
                  active: payload.active
                }
                
                if (payload.removeImage) {
                  ingredientData.file = ""
                }
                
                const res = await bambiApi.put<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, ingredientData, {
                  params: {
                    id: payload.id,
                    ingredient: JSON.stringify(ingredientData)
                  }
                })
                
                const created = res.data
                const catObj = (created as unknown as { category?: { name?: string } }).category
                const category = typeof catObj === 'object' && catObj?.name ? String(catObj.name) : String((created as unknown as { category?: string }).category ?? "")
                const { category: _omit3, ...rest } = created as Ingredient; void _omit3
                
                const updatedIngredient = { ...(rest as Omit<Ingredient, "category">), category }
                if (payload.removeImage) {
                  updatedIngredient.imgUrl = undefined
                } else if (updatedIngredient.imgUrl) {
                  const url = new URL(updatedIngredient.imgUrl)
                  url.searchParams.set('t', Date.now().toString())
                  updatedIngredient.imgUrl = url.toString()
                }
                
                set({
                  items: get().items.map((i) => (i.id === res.data.id ? updatedIngredient as StoreIngredient : i)),
                })
                toast.success("Đã cập nhật nguyên liệu")
                return
              }

              const formData = new FormData()
              formData.append('name', payload.name)
              const currentIngredient = get().items.find(i => i.id === payload.id)
              const categoryIdToUse = payload.categoryId !== undefined ? payload.categoryId : ((currentIngredient as unknown as { categoryId?: number })?.categoryId || 1)
              formData.append('categoryId', categoryIdToUse.toString())
              if (payload.unit !== undefined) {
                formData.append('unit', payload.unit)
              }
              if (payload.active !== undefined) {
                formData.append('active', payload.active.toString())
              }
              
              if (payload.removeImage) {
                formData.append('removeImage', 'true')
              }
              
              if (payload.file) {
                if (!validateFileSize(payload.file)) {
                  toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 2MB.')
                  return
                }
                const resizedFile = await resizeImage(payload.file)
                formData.append('file', resizedFile)
              }

              const res = await bambiApi.put<Ingredient>(API_ENDPOINTS.API_INGREDIENTS, formData, {
                params: {
                  id: payload.id
                },
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              const created = res.data
              const catObj = (created as unknown as { category?: { name?: string } }).category
              const category = typeof catObj === 'object' && catObj?.name ? String(catObj.name) : String((created as unknown as { category?: string }).category ?? "")
              const { category: _omit3, ...rest } = created as Ingredient; void _omit3
              
              const updatedIngredient = { ...(rest as Omit<Ingredient, "category">), category }
              if (updatedIngredient.imgUrl) {
                const url = new URL(updatedIngredient.imgUrl)
                url.searchParams.set('t', Date.now().toString())
                updatedIngredient.imgUrl = url.toString()
              } else               if (payload.removeImage) {
                updatedIngredient.imgUrl = undefined
              }
              
              set({
                items: get().items.map((i) => (i.id === res.data.id ? updatedIngredient as StoreIngredient : i)),
              })
              toast.success("Đã cập nhật nguyên liệu")
        } catch {
          toast.error("Cập nhật nguyên liệu thất bại")
        }
      },

      remove: async (id: number) => {
        try {
          const response = await bambiApi.delete(API_ENDPOINTS.API_INGREDIENT_BY_ID(id))
          console.log('Delete response:', response)
          
          set({ items: get().items.filter((i) => i.id !== id) })
          
          setTimeout(() => {
            get().fetchAll()
          }, 1000)
          
          toast.success("Đã xóa nguyên liệu")
        } catch (error) {
          console.error('Delete error:', error)
          toast.error("Xóa nguyên liệu thất bại")
        }
      },

      adjustStock: async (ingredientId, delta) => {
        if (!delta) return
        try {
          const txPayload = { 
            id: 0, 
            ingredient: { id: ingredientId } as unknown as Ingredient, 
            quantity: Math.abs(delta), 
            transactionType: delta > 0 
          }
          await bambiApi.post(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS, txPayload)

          const transactionsRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
          const transactions = transactionsRes.data || []
          
          const ingredientTransactions = transactions.filter(t => 
            t.ingredient && t.ingredient.id === ingredientId
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

          // Cập nhật state
          set({ 
            items: get().items.map(i => 
              i.id === ingredientId 
                ? { ...i, stock: totalStock, stockStatus } 
                : i
            ) 
          })
          
          toast.success("Đã cập nhật tồn kho")
        } catch {
          toast.error("Cập nhật tồn kho thất bại")
        }
      },

      getStockHistory: async (ingredientId: number) => {
        try {
          const transactionsRes = await bambiApi.get<InventoryTransaction[]>(API_ENDPOINTS.API_INVENTORY_TRANSACTIONS)
          const allTransactions = transactionsRes.data || []
          
          // Lọc transactions của ingredient cụ thể và sắp xếp theo thời gian
          const ingredientTransactions = allTransactions
            .filter(t => t.ingredient && t.ingredient.id === ingredientId)
            .sort((a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
          
          return ingredientTransactions
        } catch {
          toast.error("Không thể tải lịch sử tồn kho")
          return []
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


