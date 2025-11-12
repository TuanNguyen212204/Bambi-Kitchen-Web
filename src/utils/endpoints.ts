export const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/user/login",
  AUTH_REGISTER: "/api/account/register",
  AUTH_ME: "/api/user/me",
  AUTH_GOOGLE: "/api/user/login-with-google",
  AUTH_CHECK_EMAIL: "/api/account", 
  API_ACCOUNTS: "/api/account",
  API_ACCOUNT_BY_ID: (id: number) => `/api/account/${id}`,
  AUTH_FORGOT_PASSWORD: "/api/user/forgot-password",
  AUTH_VERIFY_OTP: "/api/mail/verify-otp",
  AUTH_RESET_PASSWORD: "/api/user/reset-password",
  
  ORDERS: "/orders",
  ORDER_CREATE: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  API_ORDERS: "/api/order",
  // API v3: lấy đơn hàng theo userId: /api/order/user/{userId}
  API_ORDERS_BY_USER: (userId: number) => `/api/order/user/${userId}`,
  API_ORDER_BY_ID: (id: number) => `/api/order/${id}`,
  // Order status updates
  API_ORDER_PREPARE: (id: number) => `/api/order/${id}/prepare`,
  API_ORDER_COMPLETE: (id: number) => `/api/order/${id}/complete`,
  // Order feedbacks & update feedback
  API_ORDER_FEEDBACKS: "/api/order/getFeedbacks",
  API_ORDER_FEEDBACK_UPDATE: "/api/order/feedback",
  // Order details
  API_ORDER_DETAILS: "/api/order-detail",
  API_ORDER_DETAILS_BY_ORDER: (orderId: number) => `/api/order-detail/by-order/${orderId}`,
  FAVORITES: "/favorites",
  PROFILE: "/api/account",
  
  API_NOTIFICATIONS: "/api/notification",
  API_NOTIFICATION_BY_ID: (id: number) => `/api/notification/${id}`,
  API_NOTIFICATION_BY_ACCOUNT: (id: number) => `/api/notification/to-account/${id}`,
  API_NOTIFICATION_MARK_READ: (id: number) => `/api/notification/${id}/check-read`,

  // Payments
  API_PAYMENTS_BY_ACCOUNT: (accountId: number) => `/api/payment/to-account/${accountId}`,

  API_INGREDIENTS: "/api/ingredient",
  API_INGREDIENT_BY_ID: (id: number) => `/api/ingredient/${id}`,
  API_INGREDIENT_SEARCH_BY_NAME: (name: string) => `/api/ingredient/search?name=${encodeURIComponent(name)}`,
  API_INGREDIENT_TOGGLE_ACTIVE: (id: number) => `/api/ingredient/toggle-active/${id}`,
  API_INGREDIENT_CATEGORIES: "/api/ingredient-category",
  API_INGREDIENT_CATEGORY_BY_ID: (id: number) => `/api/ingredient-category/${id}`,

  API_DISHES: "/api/dish",
  API_DISHES_ALL: "/api/dish/get-all", // Admin: tất cả dishes (không filter)
  API_DISH_BY_ID: (id: number) => `/api/dish/${id}`,
  API_DISH_TOGGLE_PUBLIC: (id: number) => `/api/dish/toggle-public/${id}`,
  API_DISH_TOGGLE_ACTIVE: (id: number) => `/api/dish/toggle-active/${id}`,
  API_DISH_SAVE_CUSTOM: "/api/dish/save-custom-dish",
  API_DISH_TEMPLATES: "/api/dish-template",
  API_DISH_TEMPLATE_BY_SIZE: (size: "S"|"M"|"L") => `/api/dish-template/${size}`,
  API_DISH_CATEGORIES: "/api/dish-category",
  API_DISH_CATEGORY_BY_ID: (id: number) => `/api/dish-category/${id}`,
  // Recipes & Ingredients for stock checking
  API_RECIPES: "/api/recipe",
  API_RECIPE_BY_DISH: (id: number) => `/api/recipe/by-dish/${id}`,
  // NOTE: API_INGREDIENTS đã được khai báo ở trên

  API_DISCOUNTS: "/api/discount",
  API_DISCOUNT_BY_ID: (id: number) => `/api/discount/${id}`,
  
  API_INVENTORY_TRANSACTIONS: "/api/inventory-transaction",
  
  // Admin Dashboard (API v3)
  API_ADMIN_TOTAL_REVENUE: "/api/admin/payments/total-revenue",
  API_ADMIN_ORDERS: "/api/admin/order",
  API_ADMIN_LOW_STOCK: "/api/admin/ingredients/low-stock",
  API_ADMIN_MOST_POPULAR_DISHES: "/api/admin/dishes/most-popular",
  
  AI_ANALYZE: "/ai/analyze",
  AI_SUGGESTIONS: "/ai/suggestions",
  
  // Gemini AI Chat
  API_GEMINI_CHAT: (message: string) => `/api/gemini/chat?message=${encodeURIComponent(message)}`,
  API_GEMINI_AGENT: "/api/gemini/agent",
  
  ACTIVE_ORDERS: "/staff/orders/active",
  ORDER_STATUS: (id: string) => `/staff/orders/${id}/status`,
  CLAIM_ORDER: (id: string) => `/staff/orders/${id}/claim`,
  PAYMENTS: "/staff/payments",
  
  REVENUE: "/admin/revenue",
  USERS: "/admin/users",
  MENU: "/admin/menu",
  FEEDBACK: "/admin/feedback",
  INGREDIENT_STOCK: "/admin/ingredients/stock",
  // NOTE: API_RECIPE_BY_DISH đã được khai báo ở trên
} as const


