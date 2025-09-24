import type { StateCreator } from "zustand"

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled"
export type OrderLite = { id: number; customer_name?: string; status: OrderStatus }

export type OrdersSlice = {
  activeOrders: OrderLite[]
  setActiveOrders: (orders: OrderLite[]) => void
  updateOrderStatus: (id: number, status: OrderStatus) => void
}

export const createOrdersSlice: StateCreator<OrdersSlice, [], [], OrdersSlice> = (set) => ({
  activeOrders: [],
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  updateOrderStatus: (id, status) =>
    set((state) => ({
      activeOrders: state.activeOrders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
})


