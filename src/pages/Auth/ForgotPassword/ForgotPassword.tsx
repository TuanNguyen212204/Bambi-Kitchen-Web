import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@config/path";
import { Button } from "@components/ui/button/index";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import logo from "@assets/logo.png";
import forgotPasswordImage from "@assets/ForgotPassword/ForgotPassword.png";
import { useAuthStore } from "@zustand/stores/auth";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }
    if (!email.match(/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/)) {
      setError("Email không hợp lệ.");
      return;
    }
    
    setError("");
    
    try {
      await forgotPassword(email);
      navigate(PATHS.CONFIRM_PASSWORD, { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại sau.");
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
                  Forgot Password
                </h1>
              </CardHeader>

              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Address</Label>
                    <Input
                      type="email"
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5]"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Nhập địa chỉ email của bạn"
                    />
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg"
                  >
                    {loading ? "Đang gửi..." : "Send Confirmation Code"}
                  </Button>

                  <div className="text-center">
                    <span className="text-black text-sm">Already have an account? </span>
                    <button 
                      type="button"
                      className="text-[#0d7a9b] hover:underline text-sm"
                      onClick={() => navigate(PATHS.LOGIN)}
                    >
                      Login
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

export default ForgotPassword;