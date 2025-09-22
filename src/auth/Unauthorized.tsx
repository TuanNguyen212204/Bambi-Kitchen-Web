import { Button } from "@components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { PATHS } from "@config/path"

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Không có quyền truy cập</CardTitle>
          <CardDescription>
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => navigate(-1)}>
            Quay lại trang trước
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to={PATHS.HOME}>Về trang chủ</Link>
          </Button>
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Quyền truy cập:</p>
            <p className="text-xs">👤 Khách hàng: Đặt món, xem lịch sử</p>
            <p className="text-xs">👨‍🍳 Nhân viên: Quản lý đơn hàng, bếp</p>
            <p className="text-xs">👨‍💼 Quản trị: Dashboard, phân tích</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}