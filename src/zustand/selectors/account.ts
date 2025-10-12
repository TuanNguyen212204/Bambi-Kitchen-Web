// Account selectors for zustand store
import type { AccountStore } from "@/zustand/types/account"

// Selectors for account management
export const accountSelectors = {
  // Basic selectors
  selectAccounts: (state: AccountStore) => state.items,
  selectLoading: (state: AccountStore) => state.loading,
  selectError: (state: AccountStore) => state.error,
  selectQuery: (state: AccountStore) => state.query,
  
  // Filter selectors
  selectFilteredAccounts: (state: AccountStore) => state.filteredItems(),
  selectSelectedRole: (state: AccountStore) => state.selectedRole,
  selectStatusFilter: (state: AccountStore) => state.statusFilter,
  selectViewMode: (state: AccountStore) => state.viewMode,
  selectSortBy: (state: AccountStore) => state.sortBy,
  
  // Stats selectors
  selectTotalAccounts: (state: AccountStore) => state.totalAccounts,
  selectActiveAccounts: (state: AccountStore) => state.activeAccounts,
  selectAdminAccounts: (state: AccountStore) => state.adminAccounts,
  selectStaffAccounts: (state: AccountStore) => state.staffAccounts,
  selectUserAccounts: (state: AccountStore) => state.userAccounts,
  
  // Computed selectors
  selectAccountsByRole: (state: AccountStore) => {
    const accounts = state.filteredItems()
    return {
      ADMIN: accounts.filter(acc => acc.role === "ADMIN"),
      STAFF: accounts.filter(acc => acc.role === "STAFF"),
      USER: accounts.filter(acc => acc.role === "USER"),
    }
  },
  
  selectActiveAccountsOnly: (state: AccountStore) => 
    state.filteredItems().filter(acc => acc.active !== false),
    
  selectInactiveAccountsOnly: (state: AccountStore) => 
    state.filteredItems().filter(acc => acc.active === false),
}
