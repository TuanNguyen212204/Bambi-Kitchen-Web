export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/api/account/register",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_ME: "/api/user/me",
  AUTH_CHECK_EMAIL: "/api/account", 
  
  ORDERS: "/orders",
  ORDER_CREATE: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  FAVORITES: "/favorites",
  PROFILE: "/profile",
  
  API_NOTIFICATIONS: "/api/notifications",
  API_NOTIFICATION_BY_ID: (id: number) => `/api/notifications/${id}`,
  API_NOTIFICATION_BY_ACCOUNT: (id: number) => `/api/notifications/account/${id}`,
  API_NOTIFICATION_MARK_READ: (id: number) => `/api/notifications/${id}/read`,

  API_INGREDIENTS: "/api/ingredient",
  API_INGREDIENT_BY_ID: (id: number) => `/api/ingredient/${id}`,
  API_INGREDIENT_SEARCH_BY_NAME: (name: string) => `/api/ingredient/search?name=${encodeURIComponent(name)}`,
  API_INGREDIENT_DETAILS: "/api/ingredient-details",
  API_INGREDIENT_DETAIL_BY_ID: (id: number) => `/api/ingredient-details/${id}`,
  API_INGREDIENT_DETAILS_BY_INGREDIENT: (ingredientId: number) => `/api/ingredient-details/ingredient/${ingredientId}`,
  API_INGREDIENT_DETAIL_TOGGLE_ACTIVE: (id: number) => `/api/ingredient-details/toggle-active/${id}`,
  API_INGREDIENT_CATEGORIES: "/api/ingredient-categories",
  API_INGREDIENT_CATEGORY_BY_ID: (id: number) => `/api/ingredient-categories/${id}`,

  API_DISHES: "/api/dish",
  API_DISH_BY_ID: (id: number) => `/api/dish/${id}`,
  API_DISH_CATEGORIES: "/api/dish-category",
  API_DISH_CATEGORY_BY_ID: (id: number) => `/api/dish-category/${id}`,

  API_DISCOUNTS: "/api/discount",
  API_DISCOUNT_BY_ID: (id: number) => `/api/discount/${id}`,
  
  AI_ANALYZE: "/ai/analyze",
  AI_SUGGESTIONS: "/ai/suggestions",
  
  ACTIVE_ORDERS: "/staff/orders/active",
  ORDER_STATUS: (id: string) => `/staff/orders/${id}/status`,
  CLAIM_ORDER: (id: string) => `/staff/orders/${id}/claim`,
  PAYMENTS: "/staff/payments",
  
  REVENUE: "/admin/revenue",
  USERS: "/admin/users",
  MENU: "/admin/menu",
  FEEDBACK: "/admin/feedback",
  INGREDIENT_STOCK: "/admin/ingredients/stock",
} as const


