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
  saveCustomDish: (id: number, isPublic: boolean) => Promise<void>
}

export const createDishFormSlice: StateCreator<
  DishFormSlice,
  [["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  DishFormSlice
> = () => ({
  createOrUpdate: async (payload: DishFormPayload) => {
    // API v3: POST /api/dish với DishCreateRequest truyền qua query
    await bambiApi.post(API_ENDPOINTS.API_DISHES, undefined, { params: payload })
  },
  saveCustomDish: async (id: number, isPublic: boolean) => {
    // API v3: PUT /api/dish/save-custom-dish?id=..&isPublic=..
    await bambiApi.put(API_ENDPOINTS.API_DISH_SAVE_CUSTOM, undefined, { params: { id, isPublic } })
  },
})


