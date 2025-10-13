import type { StateCreator } from "zustand"
import { bambiApi } from "@/utils/api"
import type { AccountFormSlice, AccountCreateRequest, AccountUpdateRequest } from "@/zustand/types/account"

export const createAccountFormSlice: StateCreator<AccountFormSlice> = (_set, get) => ({
  create: async (payload: AccountCreateRequest) => {
    const state = get() as any
    await bambiApi.post("/api/account", payload)
    await state.fetchAll()
  },
  
  update: async (payload: AccountUpdateRequest) => {
    const state = get() as any
    await bambiApi.put("/api/account", payload)
    await state.fetchAll()
  },
  
  remove: async (id: number) => {
    const state = get() as any
    await bambiApi.delete(`/api/account/${id}`)
    await state.fetchAll()
  },

  toggleStatus: async (id: number, active: boolean) => {
    const state = get() as any
    const accountResponse = await bambiApi.get(`/api/account/${id}`)
    const account = accountResponse.data as any
    
    await bambiApi.put('/api/account', {
      id: account.id,
      name: account.name,
      mail: account.mail,
      role: account.role,
      active: active
    })
    await state.fetchAll()
  }
})
