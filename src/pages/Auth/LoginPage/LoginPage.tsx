import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@components/ui/card/card"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Separator } from "@components/ui/separator"
import { Mail } from "lucide-react"
import logo from "@assets/logo.png"
import loginPage1 from "@assets/LoginPage/loginPage1.png"
import { useAuthStore } from "@zustand/stores/auth"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const ve: { username?: string; password?: string } = {}
    if (!username.trim()) ve.username = "Vui lòng nhập tài khoản"
    if (!password) ve.password = "Vui lòng nhập mật khẩu"
    setFieldErrors(ve)
    if (Object.keys(ve).length > 0) return

    try {
      setError("")
      await login(username, password)
      navigate("/app")
    } catch {
      setError("Tài khoản hoặc mật khẩu không đúng")
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
                    <Label className="text-muted-foreground">Username</Label>
                    <div className="relative">
                      <Input
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          setError("")
                          setFieldErrors((prev) => ({ ...prev, username: e.target.value.trim() ? undefined : prev.username }))
                        }}
                      />
                    </div>
                    {fieldErrors.username && (
                      <p className="text-red-500 text-xs">{fieldErrors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError("")
                          setFieldErrors((prev) => ({ ...prev, password: e.target.value ? undefined : prev.password }))
                        }}
                      />
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs">{fieldErrors.password}</p>
                    )}
                  </div>
                  {!fieldErrors.username && !fieldErrors.password && error && (
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
                  <button className="hover:underline">Forget password?</button>
                  <div>
                    <span className="text-black">Does not have account? </span>
                    <button className="text-[#0d7a9b] hover:underline">Sign up</button>
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
                      <img className="w-5 h-5 mr-2" alt="Google" src="" />
                      Sign in with Google
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-10 bg-white border-[#5b86e5] hover:bg-gray-50 justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2" />
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


