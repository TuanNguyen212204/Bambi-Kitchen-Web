import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import logo from "@assets/logo.png";
import confirmationBg from "@assets/ConfirmPage/ConfirmPic.png";
import { sendConfirmationCode, verifyConfirmationCode } from "@utils/auth-service";

export const ConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lấy email từ state khi chuyển từ trang forgot password
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      // Nếu không có email trong state, chuyển về trang forgot password
      navigate("/forgot-password");
    }
  }, [location.state, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationCode(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmationCode || confirmationCode.length !== 6) {
      setError("Mã xác nhận phải gồm 6 ký tự.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // Xác nhận mã với email
      const isValid = await verifyConfirmationCode(email, confirmationCode);
      
      if (isValid) {
        // TODO: Chuyển đến trang reset password với email và mã xác nhận
        navigate("/reset-password", { state: { email, code: confirmationCode } });
      } else {
        setError("Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng thử lại.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendConfirmationCode(email);
      setError(""); // Clear any previous errors
      // Có thể hiển thị thông báo thành công
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại mã xác nhận. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white grid place-items-center overflow-hidden">
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto min-h-[80vh]">
          <div className="hidden lg:flex h-full items-center justify-center">
            <img
              className="h-full w-auto max-w-full object-cover rounded-md"
              alt="Food preparation image showing hands preparing a dish"
              src={confirmationBg}
            />
          </div>

          <div className="flex h-full flex-col items-center justify-center px-2 sm:px-4">
            <div className="w-full max-w-xs sm:max-w-sm mb-2 sm:mb-3 flex-shrink-0">
              <img
                className="mx-auto w-32 sm:w-40 h-auto object-contain"
                alt="Bambi's Kitchen Logo"
                src={logo}
              />
            </div>

            <Card className="w-full max-w-xs sm:max-w-sm border rounded-xl shadow-sm flex-1 flex flex-col">
              <CardHeader className="text-center pb-2 sm:pb-3 pt-4 sm:pt-5">
                <h1 className="font-bold text-[#000000CC] text-xl sm:text-2xl leading-7 sm:leading-8">
                  Xác Nhận Mã
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Nhập mã xác nhận 6 chữ số đã được gửi đến email:
                </p>
                <p className="text-sm font-medium text-[#fc8a06] mt-1">
                  {email}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 px-4 pb-4 flex-1 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Mã Xác Nhận</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={confirmationCode}
                      onChange={handleChange}
                      placeholder="Nhập mã 6 chữ số"
                      className="border-0 border-b border-[#dbdbdb] rounded-none bg-transparent px-0 pb-2 focus-visible:ring-0 focus-visible:border-[#5b86e5] text-center text-lg tracking-widest"
                    />
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || confirmationCode.length !== 6}
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang xác nhận..." : "Xác Nhận"}
                  </Button>

                  <div className="text-center">
                    <span className="text-black text-sm">
                      Không nhận được mã?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-[#0d7a9b] hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Gửi lại
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="text-black text-sm">Quay lại đăng nhập? </span>
                    <button 
                      type="button"
                      className="text-[#0d7a9b] hover:underline text-sm"
                      onClick={() => navigate("/login")}
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

export default ConfirmationPage;