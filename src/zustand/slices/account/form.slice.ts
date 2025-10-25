import type { StateCreator } from "zustand"
import { bambiApi, API_ENDPOINTS } from "@/utils/api"
import type { AccountFormSlice, AccountCreateRequest, AccountUpdateRequest } from "@/zustand/types/account"

export const createAccountFormSlice: StateCreator<AccountFormSlice> = (_set, get) => ({
  create: async (payload: AccountCreateRequest) => {
    const state = get() as unknown as { fetchAll: () => Promise<void> }
    await bambiApi.post(API_ENDPOINTS.API_ACCOUNTS, payload)
    await state.fetchAll()
  },
  
  update: async (payload: AccountUpdateRequest) => {
    const state = get() as unknown as { fetchAll: () => Promise<void> }
    await bambiApi.put(API_ENDPOINTS.API_ACCOUNTS, payload)
    await state.fetchAll()
  },
  
  remove: async (id: number) => {
    const state = get() as unknown as { fetchAll: () => Promise<void> }
    await bambiApi.delete(API_ENDPOINTS.API_ACCOUNT_BY_ID(id))
    await state.fetchAll()
  },

  toggleStatus: async (id: number, active: boolean) => {
    const state = get() as unknown as { fetchAll: () => Promise<void> }
    const accountResponse = await bambiApi.get(API_ENDPOINTS.API_ACCOUNT_BY_ID(id))
    const account = accountResponse.data as { id: number; name: string; mail: string; role: string }
    
    await bambiApi.put(API_ENDPOINTS.API_ACCOUNTS, {
      id: account.id,
      name: account.name,
      mail: account.mail,
      role: account.role,
      active: active
    })
    await state.fetchAll()
  }
})
