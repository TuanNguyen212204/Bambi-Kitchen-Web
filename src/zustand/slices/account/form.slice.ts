import type { StateCreator } from "zustand"
import { bambiApi } from "@/utils/api"
import type { AccountFormSlice, AccountCreateRequest, AccountUpdateRequest } from "@/zustand/types/account"

export const createAccountFormSlice: StateCreator<AccountFormSlice> = (_set, get) => ({
  create: async (payload: AccountCreateRequest) => {
    const state = get() as any
    try {
      await bambiApi.post("/api/account", payload)
      await state.fetchAll()
    } catch (error: any) {
      throw error
    }
  },
  
  update: async (payload: AccountUpdateRequest) => {
    const state = get() as any
    try {
      await bambiApi.put("/api/account", payload)
      await state.fetchAll()
    } catch (error: any) {
      throw error
    }
  },
  
  remove: async (id: number) => {
    const state = get() as any
    try {
      await bambiApi.delete(`/api/account/${id}`)
      await state.fetchAll()
    } catch (error: any) {
      throw error
    }
  }
})
