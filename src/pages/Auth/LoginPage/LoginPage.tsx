import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@components/ui/card/card"
import { Button } from "@components/ui/button/index"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Separator } from "@components/ui/separator"
import { Mail, Eye, EyeOff } from "lucide-react"
import logo from "@assets/logo.png"
import loginPage1 from "@assets/LoginPage/loginPage1.png"
import { useAuthStore } from "@zustand/stores/auth"
import type { LoginPayload } from "@models/account"
import { validateLoginPayload, createLoginPayload } from "@utils/auth-validation"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    // Create LoginPayload and validate
    const payload: LoginPayload = createLoginPayload(phone, password)
    const validation = validateLoginPayload(payload)
    
    const ve: { phone?: string; password?: string } = {}
    if (!validation.isValid) {
      if (!phone.trim()) ve.phone = "Vui lòng nhập số điện thoại"
      else if (!password) ve.password = "Vui lòng nhập mật khẩu"
      else setError(validation.error || "Thông tin không hợp lệ")
    }
    
    setFieldErrors(ve)
    if (Object.keys(ve).length > 0) return

    try {
      setError("")
      await login(phone, password)
      navigate("/app")
    } catch {
      setError("Số điện thoại hoặc mật khẩu không đúng")
    }
  }

  return (
    <div className="h-screen w-full bg-white grid place-items-center overflow-hidden">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center max-w-4xl mx-auto">
          <div className="hidden lg:flex items-center justify-center">
            <img
              className="w-full max-w-md xl:max-w-xl 2xl:max-w-2xl rounded-md object-cover"
              alt="Chef plating food"
              src={loginPage1}
            />
          </div>

          <div className="flex flex-col items-center justify-center px-2 sm:px-4">
            <div className="w-full max-w-xs sm:max-w-sm mb-3 sm:mb-4">
              <img
                className="mx-auto w-40 sm:w-56 h-auto object-contain"
                alt="Bambi's Kitchen Logo"
                src={logo}
              />
            </div>

            <Card className="w-full max-w-xs sm:max-w-sm border rounded-xl shadow-sm">
              <CardHeader className="text-center pb-3 sm:pb-4">
                <h1 className="font-bold text-[#000000CC] text-xl sm:text-2xl leading-7 sm:leading-8">
                  Sign in
                </h1>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Số điện thoại</Label>
                    <div className="relative">
                      <Input
                        type="tel"
                        inputMode="tel"
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value)
                          setError("")
                          setFieldErrors((prev) => ({ ...prev, phone: e.target.value.trim() ? undefined : prev.phone }))
                        }}
                        placeholder="Nhập số điện thoại của bạn"
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-red-500 text-xs">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError("")
                          setFieldErrors((prev) => ({ ...prev, password: e.target.value ? undefined : prev.password }))
                        }}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs">{fieldErrors.password}</p>
                    )}
                  </div>
                  {!fieldErrors.phone && !fieldErrors.password && error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg"
                >
                  {loading ? "Đang đăng nhập..." : "Sign In"}
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <button className="hover:underline" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
                  <div>
                    <span className="text-black">Does not have account? </span>
                    <button className="text-[#0d7a9b] hover:underline" onClick={() => navigate("/register")}>Register</button>
                  </div>
                </div>

                <div className="flex items-center justify-center my-3 sm:my-4 gap-3">
                  <Separator className="flex-1" />
                  <span className="font-bold text-[#828282] text-base sm:text-lg">OR</span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-10 bg-white border-[#5b86e5] hover:bg-gray-50 justify-center"
                    >
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                        <path 
                          fill="#4285F4" 
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path 
                          fill="#34A853" 
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path 
                          fill="#FBBC05" 
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path 
                          fill="#EA4335" 
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-10 bg-white border-[#5b86e5] hover:bg-gray-50 justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
                      Sign in with Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


