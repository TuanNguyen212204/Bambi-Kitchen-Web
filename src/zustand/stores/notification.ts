import { create } from "zustand"
import { devtools, subscribeWithSelector } from "zustand/middleware"
import { persist, createJSONStorage } from "zustand/middleware"
import type { NotificationStore } from "@/zustand/types/notification"
import { 
  createNotificationListSlice,
  createNotificationFilterSlice,
  createNotificationFormSlice
} from "@/zustand/slices/notification"

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (...a) => ({
          ...createNotificationListSlice(...a),
          ...createNotificationFilterSlice(...a),
          ...createNotificationFormSlice(...a),
          
          viewMode: "grid" as "grid" | "list",
          setViewMode: (mode: "grid" | "list") => a[0]({ viewMode: mode }),
        }),
        {
          name: "bambi-notification-storage",
          storage: createJSONStorage(() => localStorage),
          partialize: (state: NotificationStore) => ({
            items: state.items,
            viewMode: state.viewMode,
          }),
        }
      )
    )
  )
)

