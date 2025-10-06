import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PATHS } from "@config/path";
import { Button } from "@components/ui/button/index";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Eye, EyeOff } from "lucide-react";
import logo from "@assets/logo.png";
import forgotPasswordImage from "@assets/ForgotPassword/ForgotPassword.png";
import { useAuthStore } from "@zustand/stores/auth";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, loading } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailFromState = location.state?.email;
    const otpFromState = location.state?.code;
    
    if (emailFromState && otpFromState) {
      setEmail(emailFromState);
      setOtp(otpFromState);
    } else {
      navigate(PATHS.FORGOT_PASSWORD);
    }
  }, [location.state, navigate]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    
    setError("");
    
    try {
      await resetPassword(email, otp, newPassword);
            navigate(PATHS.LOGIN, { 
        state: { 
          message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới." 
        } 
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="h-screen w-full bg-white grid place-items-center overflow-hidden">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center max-w-4xl mx-auto">
          <div className="hidden lg:flex items-center justify-center">
            <img
              className="w-full max-w-md xl:max-w-xl 2xl:max-w-2xl rounded-md object-cover"
              alt="Woman holding a bowl of healthy food"
              src={forgotPasswordImage}
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
                  Đặt Lại Mật Khẩu
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Nhập mật khẩu mới cho tài khoản:
                </p>
                <p className="text-sm font-medium text-[#fc8a06] mt-1">
                  {email}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Nhập mật khẩu mới"
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
                    <Label className="text-muted-foreground">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Nhập lại mật khẩu mới"
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

                  {error && <p className="text-red-500 text-xs">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg"
                  >
                    {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
                  </Button>

                  <div className="text-center">
                    <span className="text-black text-sm">Quay lại đăng nhập? </span>
                    <button 
                      type="button"
                      className="text-[#0d7a9b] hover:underline text-sm"
                      onClick={() => navigate(PATHS.LOGIN)}
                    >
                      Đăng nhập
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
