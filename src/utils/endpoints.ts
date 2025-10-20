export const API_ENDPOINTS = {
  AUTH_LOGIN: "/login",
  AUTH_REGISTER: "/api/account/register",
  AUTH_ME: "/api/user/me",
  AUTH_GOOGLE: "/api/user/google",
  AUTH_CHECK_EMAIL: "/api/account", 
  API_ACCOUNTS: "/api/account",
  API_ACCOUNT_BY_ID: (id: number) => `/api/account/${id}`,
  AUTH_FORGOT_PASSWORD: "/api/user/forgot-password",
  AUTH_VERIFY_OTP: "/api/mail/verify-otp",
  AUTH_RESET_PASSWORD: "/api/user/reset-password",
  
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
  API_INGREDIENT_CATEGORIES: "/api/ingredient-category",
  API_INGREDIENT_CATEGORY_BY_ID: (id: number) => `/api/ingredient-category/${id}`,

  API_DISHES: "/api/dish",
  API_DISH_BY_ID: (id: number) => `/api/dish/${id}`,
  API_DISH_TOGGLE_PUBLIC: (id: number) => `/api/dish/toggle-public/${id}`,
  API_DISH_TOGGLE_ACTIVE: (id: number) => `/api/dish/toggle-active/${id}`,
  API_DISH_SAVE_CUSTOM: "/api/dish/save-custom-dish",
  API_DISH_CATEGORIES: "/api/dish-category",
  API_DISH_CATEGORY_BY_ID: (id: number) => `/api/dish-category/${id}`,
  API_DISH_TEMPLATES: "/api/dish-template",
  API_DISH_TEMPLATE_BY_SIZE: (sizeCode: "S"|"M"|"L") => `/api/dish-template/${sizeCode}`,

  API_DISCOUNTS: "/api/discount",
  API_DISCOUNT_BY_ID: (id: number) => `/api/discount/${id}`,
  
  API_INVENTORY_TRANSACTIONS: "/api/inventory-transaction",
  
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


