import type { Ingredient } from "@models/ingredient/ingredient"
import type { IngredientCategory } from "@models/category/category"

export type StockStatus = "out" | "low" | "normal"
export type StoreIngredient = Omit<Ingredient, "category"> & { 
  category: string
  categoryId?: number
  stock?: number
  stockStatus?: StockStatus
  active?: boolean 
  quantity?: number
  available?: number
  reserve?: number
  pricePerUnit?: number
  imgUrl?: string
  publicId?: string
  lastReserveAt?: string
}

export interface InventoryTransaction {
  id: number
  ingredient: { id: number }
  orders?: { id: number }
  createAt: string
  quantity: number
  transactionType: boolean
}

export interface IngredientListSlice {
  items: StoreIngredient[]
  loading: boolean
  query: string
  
  fetchAll: () => Promise<void>
  searchByName: (name: string) => Promise<void>
  setQuery: (query: string) => void
  filteredItems: () => StoreIngredient[]
}

export interface IngredientCategorySlice {
  categories: IngredientCategory[]
  
  fetchCategories: () => Promise<void>
  createCategory: (payload: { name: string; description?: string; priority?: number }) => Promise<IngredientCategory | undefined>
  updateCategory: (payload: { id: number; name: string; description?: string; priority?: number }) => Promise<void>
  removeCategory: (id: number) => Promise<void>
}

export interface IngredientFormSlice {
  create: (payload: { name: string; categoryId: number; unit: string; pricePerUnit?: number; file?: File }) => Promise<void>
  update: (payload: { id: number; name: string; categoryId?: number; unit?: string; active?: boolean; available?: number; quantity?: number; reserve?: number; pricePerUnit?: number; file?: File; removeImage?: boolean; silent?: boolean }) => Promise<void>
  remove: (id: number) => Promise<void>
  toggleActive: (id: number, active: boolean) => Promise<void>
}

export interface IngredientStockSlice {
  adjustStock: (ingredientId: number, delta: number) => Promise<void>
  getStockHistory: (ingredientId: number) => Promise<InventoryTransaction[]>
}

export interface IngredientFilterSlice {
  selectedCategoryId?: number
  statusFilter?: "all" | "active" | "inactive"
  stockFilter?: "all" | "out" | "low" | "normal"
  viewMode: "grid" | "list"
  sortBy: "priority" | "name_asc" | "name_desc" | "stock_asc" | "stock_desc"
  
  setSelectedCategoryId: (id?: number) => void
  setStatusFilter: (s: "all" | "active" | "inactive") => void
  setStockFilter: (s: "all" | "out" | "low" | "normal") => void
  setViewMode: (m: "grid" | "list") => void
  setSortBy: (s: IngredientFilterSlice["sortBy"]) => void
  getFilteredItems: () => StoreIngredient[]
}

export type IngredientStore = 
  IngredientListSlice & 
  IngredientCategorySlice & 
  IngredientFormSlice & 
  IngredientStockSlice & 
  IngredientFilterSlice & {
  filteredItems: () => StoreIngredient[]
  sessionCreatedIds?: number[]
}

export type IngredientState = IngredientStore
