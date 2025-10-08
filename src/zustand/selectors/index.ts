import { shallow } from "zustand/shallow"
import type { User } from "@/zustand/types"
import type { StoreIngredient, IngredientCategory } from "@/zustand/types"
export { shallow }

export const selectAuthUser = (s: { user: User | null }) => s.user
export const selectIsAuthenticated = (s: { isAuthenticated: boolean }) => s.isAuthenticated
export const selectAuthLoading = (s: { loading: boolean }) => s.loading
export const selectAuthError = (s: { error: string | null }) => s.error

export const selectIngredients = (s: { items: StoreIngredient[] }) => s.items
export const selectIngredientCategories = (s: { categories: IngredientCategory[] }) => s.categories
export const selectFilteredIngredients = (s: { filteredItems: () => StoreIngredient[] }) => s.filteredItems()
export const selectIngredientLoading = (s: { loading: boolean }) => s.loading
export const selectIngredientQuery = (s: { query: string }) => s.query

export const selectActiveOrders = (s: { activeOrders: unknown[] }) => s.activeOrders
export const selectCurrentStep = (s: { currentStep: string }) => s.currentStep

