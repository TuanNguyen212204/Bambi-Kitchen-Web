import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { Suspense, lazy, memo } from "react"
import Authentication from "@/auth/Authentication"
import Authorization from "@/auth/Authorization"
import MainLayout from "@components/layouts/MainLayout"
import AdminLayout from "@components/layouts/AdminLayout"
import { AUTH_PUBLIC_ROUTES, CUSTOMER_PUBLIC_ROUTES, CUSTOMER_PRIVATE_ROUTES, PRIVATE_ROUTES, ROLES } from "@config/routes"
import { PATHS } from "@config/path"
import ErrorPage from "@pages/error/ErrorPage"
import { HTTP_STATUS } from "@config/httpStatus"
import { useAuthStore } from "@zustand/stores/auth"


const Unauthenticated = lazy(() => import("@/auth/Unauthenticated"))
const Unauthorized = lazy(() => import("@/auth/Unauthorized"))

const createRouteElement = (Component: React.ComponentType, fallback: React.ReactNode) => (
  <Suspense fallback={fallback}>
    <Component />
  </Suspense>
)

const LoadingFallback = (<div className="p-4 text-center">Đang tải...</div>)

const ErrorFallback = <ErrorPage />

export const AppRoute = memo(() => {
  // Thành phần redirect động cho trang index của /admin
  const AdminIndex = () => {
    const { user } = useAuthStore()
    const roleId = user?.role_id
    // Admin -> dashboard, Staff -> orders
    if (roleId === ROLES.STAFF) {
      return <Navigate to="orders" replace />
    }
    return <Navigate to="dashboard" replace />
  }

  const router = createBrowserRouter([
    ...AUTH_PUBLIC_ROUTES.map((route) => ({
      path: route.path,
      element: createRouteElement(route.component, LoadingFallback),
      errorElement: ErrorFallback,
    })),
    {
      path: PATHS.UNAUTHENTICATED,
      element: createRouteElement(Unauthenticated, <div>Loading...</div>),
      errorElement: ErrorFallback,
    },
    {
      path: PATHS.UNAUTHORIZED,
      element: createRouteElement(Unauthorized, <div>Loading...</div>),
      errorElement: ErrorFallback,
    },
    {
      path: "/",
      element: (
        <div className="min-h-screen bg-background">
          <MainLayout />
        </div>
      ),
      errorElement: ErrorFallback,
      children: CUSTOMER_PUBLIC_ROUTES.map((route) => ({
        index: route.path === PATHS.HOME,
        path: route.path === PATHS.HOME ? undefined : route.path,
        element: createRouteElement(route.component, LoadingFallback),
        errorElement: ErrorFallback,
      })),
    },
    {
      path: "/admin",
      element: (
        <Authentication fallback={<Unauthenticated />}>
          <Authorization role_id={[ROLES.ADMIN, ROLES.STAFF]}>
            <AdminLayout />
          </Authorization>
        </Authentication>
      ),
      errorElement: ErrorFallback,
      children: [
        // Khi truy cập /admin, điều hướng theo role: Admin -> dashboard, Staff -> orders
        { index: true, element: createRouteElement(AdminIndex, LoadingFallback) },
        ...PRIVATE_ROUTES
        .filter((r) => {
          // Ẩn các routes bị disable (giữ code để sử dụng trong tương lai)
          const HIDDEN_ROUTES = ["dish-categories", "sold-ingredients"];
          const isHidden = HIDDEN_ROUTES.includes(r.path);
          // Hiển thị route nếu được bảo vệ, thuộc layout admin, không hidden, và role của route bao gồm ADMIN hoặc STAFF
          const allowRoles = [ROLES.ADMIN, ROLES.STAFF]
          const canSee = r.protected && r.layout === "admin" && !isHidden && r.role?.some((role) => allowRoles.includes(role))
          return canSee
        })
        .map((route) => ({
          // Không auto-index dashboard nữa; luôn dùng đường dẫn tường minh
          path: route.path,
          element: createRouteElement(route.component, LoadingFallback),
          errorElement: ErrorFallback,
        })),
      ],
    },
    ...CUSTOMER_PRIVATE_ROUTES.map((route) => ({
      path: route.path,
      element: (
        <Authentication fallback={<Unauthenticated />}>
          <Authorization role_id={ROLES.CUSTOMER}>
            <div className="min-h-screen bg-background">
              <MainLayout />
            </div>
          </Authorization>
        </Authentication>
      ),
      errorElement: ErrorFallback,
      children: [
        {
          index: true,
          element: createRouteElement(route.component, LoadingFallback),
          errorElement: ErrorFallback,
        },
      ],
    })),

    {
      path: "*",
      element: (
        <ErrorPage
          code={HTTP_STATUS.NOT_FOUND}
          message="Trang không tồn tại"
        />
      ),
    },
  ])

  return <RouterProvider router={router} />
})

AppRoute.displayName = "AppRoute"