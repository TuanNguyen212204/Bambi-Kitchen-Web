import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { bambiApi } from "@utils/api";
import { API_ENDPOINTS } from "@utils/endpoints";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { Mail, Eye, EyeOff } from "lucide-react";
import logo from "@assets/logo.png";
import registerImage from "@assets/RegisterPage/registerPage.png";

export function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(formData.email)) {
      setError("Email không hợp lệ.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setError("");

    try {
      setLoading(true);
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        mail: formData.email.trim(),
        password: formData.password,
      };
      await bambiApi.post(API_ENDPOINTS.AUTH_REGISTER, payload, { skipAuth: true });
      toast.success("Đăng ký thành công!", { description: "Vui lòng đăng nhập để tiếp tục." });
      navigate("/login");
    } catch (err: unknown) {

      const axiosError = err as { 
        response?: { 
          status?: number; 
          data?: { 
            message?: string; 
            details?: string 
          } 
        }; 
        message?: string;
      };
      
      console.error("Registration error:", err);
      console.error("Error response:", axiosError?.response);
      console.error("Error status:", axiosError?.response?.status);
      console.error("Error data:", axiosError?.response?.data);

      if (axiosError?.response?.status === 400) {
        toast.error("Thông tin không hợp lệ", { 
          description: axiosError?.response?.data?.message || "Vui lòng kiểm tra lại thông tin đã nhập." 
        });
      } else if (axiosError?.response?.status === 409) {
        toast.error("Email đã tồn tại", { 
          description: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác." 
        });
      }

      const stateError = axiosError?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(stateError);
      console.error("Setting form error:", stateError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white grid place-items-center overflow-hidden">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto min-h-[80vh]">
          <div className="hidden lg:flex h-full items-center justify-center max-w-md xl:max-w-xl 2xl:max-w-2xl overflow-hidden rounded-md">
            <img
              className="h-full w-auto object-cover"
              alt="Register visual"
              src={registerImage}
            />
          </div>

          <div className="flex h-full flex-col items-center justify-center px-2 sm:px-4 lg:-mt-2">
            <div className="w-full max-w-xs sm:max-w-sm mb-3 sm:mb-4">
              <img
                className="mx-auto w-40 sm:w-56 h-auto object-contain"
                alt="Bambi's Kitchen Logo"
                src={logo}
              />
            </div>

            <Card className="w-full max-w-xl h-full border rounded-xl shadow-sm">
              <CardHeader className="text-center pb-3 sm:pb-4">
                <h1 className="font-bold text-[#000000CC] text-xl sm:text-2xl leading-7 sm:leading-8">
                  Create Account
                </h1>
              </CardHeader>

              <CardContent className="space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">First Name</Label>
                    <Input
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      placeholder="Ví dụ: Tuấn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Name</Label>
                    <Input
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      placeholder="Ví dụ: Nguyễn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Address</Label>
                    <Input
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Ví dụ: tuan.nguyen@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <Input
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Ví dụ: 0901234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                      type={showPassword ? "text" : "password"}
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
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
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Input
                      type={showConfirmPassword ? "text" : "password"}
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg"
                  >
                    {loading ? "Đang tạo tài khoản..." : "Create Account"}
                  </Button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <div>
                    <span className="text-black">Already have an account? </span>
                    <a href="/login" className="text-[#0d7a9b] hover:underline">Login</a>
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
                      Sign up with Google
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-10 bg-white border-[#5b86e5] hover:bg-gray-50 justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2 flex-shrink-0" />
                      Sign up with Email
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-center text-black">FASCO Terms & Conditions</div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;