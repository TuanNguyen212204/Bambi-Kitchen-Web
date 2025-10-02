import { lazy } from "react"
import { PATHS } from "@config/path"
const Login = lazy(() => import("@pages/Auth/LoginPage"))
const Register = lazy(() => import("@pages/Auth/RegisterPage/RegisterPage"))
const ForgotPassword = lazy(() => import("@pages/Auth/ForgotPassword"))
const ResetPassword = lazy(() => import("@pages/Auth/ConfirmationPage/ConfirmationPage"))
const Success = lazy(() => import("@pages/success"))
const ErrorPage = lazy(() => import("@pages/error/ErrorPage"))
const OrdersPage = lazy(() => import("@pages/customerPage/orders/OrdersPage"))

const Home = lazy(() => import("@pages/customerPage/home/HomePage"))
const AdminDashboard = lazy(() => import("@pages/adminPage/dashboard"))
const AdminOrders = lazy(() => import("@pages/adminPage/orders"))
const AdminMenu = lazy(() => import("@pages/adminPage/menu"))
const AdminIngredients = lazy(() => import("@pages/adminPage/ingredientManagement/ingredient/ingredient"))
const AdminFeedback = lazy(() => import("@pages/adminPage/feedback"))
const AdminSettings = lazy(() => import("@pages/adminPage/settings"))
// const OrderBuilder = lazy(() => import("@/pages/customer/OrderBuilder"))
// const OrderHistory = lazy(() => import("@/pages/customer/OrderHistory"))
// const QuickOrder = lazy(() => import("@/pages/customer/QuickOrder"))
// const Profile = lazy(() => import("@/pages/customer/Profile"))
// const Favorites = lazy(() => import("@/pages/customer/Favorites"))

// const StaffDashboard = lazy(() => import("@/pages/staff/Dashboard"))
// const OrderManagement = lazy(() => import("@/pages/staff/OrderManagement"))
// const KitchenView = lazy(() => import("@/pages/staff/KitchenView"))
// const IngredientManagement = lazy(() => import("@/pages/staff/IngredientManagement"))
// const PaymentConfirmation = lazy(() => import("@/pages/staff/PaymentConfirmation"))

// const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"))
// const RevenueAnalytics = lazy(() => import("@/pages/admin/RevenueAnalytics"))
// const MenuManagement = lazy(() => import("@/pages/admin/MenuManagement"))
// const IngredientCatalog = lazy(() => import("@/pages/admin/IngredientCatalog"))
// const UserManagement = lazy(() => import("@/pages/admin/UserManagement"))
// const OrderAnalytics = lazy(() => import("@/pages/admin/OrderAnalytics"))
// const FeedbackManagement = lazy(() => import("@/pages/admin/FeedbackManagement"))

// const ErrorPage = lazy(() => import("@/pages/ErrorPage"))

export const ROLES = {
  CUSTOMER: 4, 
  STAFF: 3,       
  ADMIN: 1, 
} as const
export type RouteLayout = "main" | "admin"

export interface RouteConfig {
  path: string
  component: React.ComponentType
  label: string
  protected: boolean
  role?: number[]
  icon?: React.ReactNode
  layout?: RouteLayout
}

export const AUTH_PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: PATHS.LOGIN,
    component: Login,
    label: "Đăng nhập",
    protected: false,
    role: [],
  },
  {
    path: PATHS.REGISTER,
    component: Register,
    label: "Đăng ký", 
    protected: false,
    role: [],
  },
  {
    path: PATHS.FORGOT_PASSWORD,
    component: ForgotPassword,
    label: "Quên mật khẩu",
    protected: false,
    role: [],
  },
  {
    path: PATHS.RESET_PASSWORD,
    component: ResetPassword,
    label: "Đặt lại mật khẩu",
    protected: false,
    role: [],
  },
  {
    path: PATHS.SUCCESS,
    component: Success,
    label: "Thành công",
    protected: false,
    role: [],
  },
  {
    path: PATHS.ERROR,
    component: ErrorPage,
    label: "Lỗi",
    protected: false,
    role: [],
  },
]

export const CUSTOMER_PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: PATHS.HOME,
    component: Home,
    label: "Trang chủ",
    protected: false,
    role: [],
  },
]

export const CUSTOMER_PRIVATE_ROUTES: RouteConfig[] = [
  {
    path: PATHS.ORDERS,
    component: OrdersPage,
    label: "Đơn hàng",
    protected: true,
    role: [ROLES.CUSTOMER],
  },
  // {
  //   path: PATHS.PROFILE,
  //   component: () => <div>Profile Page</div>,
  //   label: "Hồ sơ cá nhân",
  //   protected: true,
  //   role: [ROLES.CUSTOMER],
  // },
  // {
  //   path: "/cart",
  //   component: () => <div>Cart Page</div>,
  //   label: "Giỏ hàng",
  //   protected: true,
  //   role: [ROLES.CUSTOMER],
  // },
  // {
  //   path: PATHS.FAVORITES,
  //   component: () => <div>Favorites Page</div>,
  //   label: "Món yêu thích",
  //   protected: true,
  //   role: [ROLES.CUSTOMER],
  // },
]

export const PRIVATE_ROUTES: RouteConfig[] = [
  {
    path: "dashboard",
    component: AdminDashboard,
    label: "Dashboard",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
  {
    path: "orders",
    component: AdminOrders,
    label: "Orders",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
  {
    path: "menu",
    component: AdminMenu,
    label: "Menu",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
  {
    path: "ingredients",
    component: AdminIngredients,
    label: "Ingredients",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
  {
    path: "feedback",
    component: AdminFeedback,
    label: "Feedback",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
  {
    path: "settings",
    component: AdminSettings,
    label: "Settings",
    protected: true,
    role: [ROLES.ADMIN],
    layout: "admin",
  },
]
// export const PRIVATE_ROUTES: RouteConfig[] = [
//   {
//     path: PATHS.ORDER,
//     component: OrderBuilder,
//     label: "Đặt món",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//     icon: "🍚", 
//   },
//   {
//     path: PATHS.ORDER_STEP,
//     component: OrderBuilder,
//     label: "Xây dựng món ăn",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//   },
//   {
//     path: PATHS.ORDER_HISTORY,
//     component: OrderHistory,
//     label: "Lịch sử đơn hàng",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//     icon: "📋",
//   },
//   {
//     path: PATHS.QUICK_ORDER,
//     component: QuickOrder,
//     label: "Đặt nhanh",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//     icon: "⚡",
//   },
//   {
//     path: PATHS.PROFILE,
//     component: Profile,
//     label: "Hồ sơ cá nhân",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//     icon: "👤",
//   },
//   {
//     path: PATHS.FAVORITES,
//     component: Favorites,
//     label: "Món yêu thích",
//     protected: true,
//     role: [ROLES.CUSTOMER],
//     icon: "❤️",
//   },
//   {
//     path: PATHS.STAFF,
//     component: StaffDashboard,
//     label: "Bảng điều khiển",
//     protected: true,
//     role: [ROLES.STAFF],
//     icon: "🏪",
//   },
//   {
//     path: PATHS.STAFF_ORDERS,
//     component: OrderManagement,
//     label: "Quản lý đơn hàng",
//     protected: true,
//     role: [ROLES.STAFF],
//     icon: "📦",
//   },
//   {
//     path: PATHS.STAFF_KITCHEN,
//     component: KitchenView,
//     label: "Bếp",
//     protected: true,
//     role: [ROLES.STAFF],
//     icon: "🔥",
//   },
//   {
//     path: PATHS.STAFF_INGREDIENTS,
//     component: IngredientManagement,
//     label: "Nguyên liệu",
//     protected: true,
//     role: [ROLES.STAFF],
//     icon: "🥬",
//   },
//   {
//     path: PATHS.STAFF_PAYMENTS,
//     component: PaymentConfirmation,
//     label: "Xác nhận thanh toán",
//     protected: true,
//     role: [ROLES.STAFF],
//     icon: "💰",
//   },
//   {
//     path: PATHS.ADMIN,
//     component: AdminDashboard,
//     label: "Dashboard",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "📊",
//   },
//   {
//     path: PATHS.ADMIN_REVENUE,
//     component: RevenueAnalytics,
//     label: "Doanh thu",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "💵",
//   },
//   {
//     path: PATHS.ADMIN_MENU,
//     component: MenuManagement,
//     label: "Quản lý món ăn",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "🍽️",
//   },
//   {
//     path: PATHS.ADMIN_INGREDIENTS,
//     component: IngredientCatalog,
//     label: "Danh mục nguyên liệu",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "🥘",
//   },
//   {
//     path: PATHS.ADMIN_USERS,
//     component: UserManagement,
//     label: "Quản lý người dùng",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "👥",
//   },
//   {
//     path: PATHS.ADMIN_ORDERS,
//     component: OrderAnalytics,
//     label: "Phân tích đơn hàng",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "📈",
//   },
//   {
//     path: PATHS.ADMIN_FEEDBACK,
//     component: FeedbackManagement,
//     label: "Phản hồi khách hàng",
//     protected: true,
//     role: [ROLES.ADMIN],
//     icon: "💬",
//   },
// ]