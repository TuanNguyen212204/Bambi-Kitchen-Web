import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@zustand/stores/auth"
import { PATHS } from "@config/path"
// import { HTTP_STATUS } from "@config/httpStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card/card"
import { Loader2 } from "lucide-react"
// import { toast } from "sonner"

interface AuthenticationProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function Authentication({ children, fallback }: AuthenticationProps) {
  const { user, verifyAuth, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Chào mừng đến Bambi Kitchen</CardTitle>
            <CardDescription>
              Hệ thống đặt món ăn healthy với AI cá nhân hóa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => navigate(PATHS.LOGIN)}
            >
              Đăng nhập
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(PATHS.REGISTER)}
            >
              Đăng ký tài khoản
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Đặt món ăn healthy theo từng bước với gợi ý AI thông minh
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}