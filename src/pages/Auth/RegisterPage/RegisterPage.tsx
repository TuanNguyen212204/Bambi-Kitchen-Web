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
    } catch {
      toast.error("Đăng ký thất bại", { description: "Vui lòng kiểm tra thông tin và thử lại." });
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
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      <img className="w-5 h-5 mr-2" alt="Google" src="" />
                      Sign up with Google
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-10 bg-white border-[#5b86e5] hover:bg-gray-50 justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2" />
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