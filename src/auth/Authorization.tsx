import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@zustand/stores/auth"
import { ROLES } from "@config/routes"
import { PATHS } from "@config/path"
// import { HTTP_STATUS } from "@config/httpStatus"
// import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AuthorizationProps {
  children: React.ReactNode
  role_id: number | number[]
}

export default function Authorization({ children, role_id }: AuthorizationProps) {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role_id || ROLES.CUSTOMER
      const allowedRoles = Array.isArray(role_id) ? role_id : [role_id]

      if (!allowedRoles.includes(userRole)) {
        toast.error("Bạn không có quyền truy cập trang này", {
          description: "Vui lòng liên hệ quản trị viên để được cấp quyền phù hợp",
          duration: 5000,
        })
        navigate(PATHS.UNAUTHORIZED, { replace: true, state: { from: location } })
      }
    }
  }, [user, role_id, loading, navigate, location])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }


  return <>{children}</>
}