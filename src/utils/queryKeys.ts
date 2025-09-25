export const apiQueryKeys = {
  auth: ["auth"] as const,
  orders: (userId?: string) => ["orders", userId] as const,
  order: (id: string) => ["order", id] as const,
  favorites: (userId: string) => ["favorites", userId] as const,
  ingredients: (category?: string) => ["ingredients", category] as const,
  dishes: (categoryId?: number) => ["dishes", categoryId] as const,
  aiAnalysis: (orderId: string) => ["ai-analysis", orderId] as const,
  activeOrders: () => ["active-orders"] as const,
  revenue: (startDate: string, endDate: string) => ["revenue", startDate, endDate] as const,
  users: () => ["users"] as const,
} as const


