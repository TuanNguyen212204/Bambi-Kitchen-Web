import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Suspense, lazy, memo } from "react"
import Authentication from "@/auth/Authentication" 
import Authorization from "@/auth/Authorization"
import MainLayout from "@components/layouts/MainLayout"
import { AUTH_PUBLIC_ROUTES, CUSTOMER_PUBLIC_ROUTES, PRIVATE_ROUTES, ROLES } from "@config/routes"
import { PATHS } from "@config/path"
import ErrorPage from "@pages/error/ErrorPage"
import { HTTP_STATUS } from "@config/httpStatus"


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
  const router = createBrowserRouter([
    ...AUTH_PUBLIC_ROUTES.map((route) => ({
      path: route.path,
      element: createRouteElement(route.component, LoadingFallback),
      errorElement: ErrorFallback,
    })),


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
      path: "/app",
      element: (
        <Authentication fallback={<Unauthenticated />}>
          <div className="min-h-screen bg-background">
            <MainLayout />
          </div>
        </Authentication>
      ),
      errorElement: ErrorFallback,
      children: PRIVATE_ROUTES.map((route) => ({
        path: route.path,
        element: (
          <Authorization role_id={route.role || ROLES.CUSTOMER}>
            {createRouteElement(route.component, LoadingFallback)}
          </Authorization>
        ),
        errorElement: ErrorFallback,
      })),
    },

    {
      path: PATHS.ERROR,
      element: <ErrorPage />,
    },

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