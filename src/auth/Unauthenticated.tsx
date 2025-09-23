import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card/card"
import { Mail, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { PATHS } from "@config/path"

export default function Unauthenticated() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Chưa đăng nhập</CardTitle>
          <CardDescription>
            Bạn cần đăng nhập để sử dụng hệ thống Bambi Kitchen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link to={PATHS.LOGIN}>Đăng nhập ngay</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to={PATHS.REGISTER}>Tạo tài khoản mới</Link>
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            Đặt món ăn healthy với AI cá nhân hóa • Hệ thống quản lý bếp thông minh
          </div>
        </CardContent>
      </Card>
    </div>
  )
}