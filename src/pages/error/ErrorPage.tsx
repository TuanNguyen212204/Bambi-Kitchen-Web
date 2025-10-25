import { Button } from "@components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card/card"
import { AlertTriangle, Home } from "lucide-react"
import { Link } from "react-router-dom"
import { PATHS } from "@config/path"

interface ErrorPageProps {
  code?: number
  message?: string
}

export const ErrorPage = ({ code, message }: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Lỗi {code ?? 500}</CardTitle>
          <CardDescription>
            {message ?? "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link to={PATHS.HOME}>
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Tải lại trang
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorPage;