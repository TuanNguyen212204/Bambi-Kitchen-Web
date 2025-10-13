import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AccountStore } from "@/zustand/types/account"
import { 
  createAccountListSlice,
  createAccountFormSlice,
  createAccountFilterSlice,
  createAccountStatsSlice
} from "@/zustand/slices/account"

export const useAccountStore = create<AccountStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get, store) => ({
          ...createAccountListSlice(set, get, store),
          ...createAccountFormSlice(set, get, store),
          ...createAccountFilterSlice(set, get, store),
          ...createAccountStatsSlice(set, get, store),
        }),
        {
          name: "bambi-account-storage",
          storage: createJSONStorage(() => localStorage),
          partialize: (state: AccountStore) => ({
            items: state.items,
            selectedRole: state.selectedRole,
            statusFilter: state.statusFilter,
            viewMode: state.viewMode,
            sortBy: state.sortBy,
          }),
        }
      )
    )
  )
)