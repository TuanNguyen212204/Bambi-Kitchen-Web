import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"

export interface DishFormPayload {
  id?: number
  name: string
  description?: string
  price?: number
  imageUrl?: string
  account?: { id: number }
  dishType: "PRESET" | "CUSTOM"
  ingredients: Record<number, number>
  public?: boolean
  active?: boolean
}

export interface DishFormSlice {
  createOrUpdate: (payload: DishFormPayload) => Promise<void>
}

export const createDishFormSlice: StateCreator<
  DishFormSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishFormSlice
> = () => ({
  createOrUpdate: async (payload: DishFormPayload) => {
    await bambiApi.post(API_ENDPOINTS.API_DISHES, payload)
  },
})


