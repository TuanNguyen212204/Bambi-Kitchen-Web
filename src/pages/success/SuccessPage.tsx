import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Button } from "@components/ui/button/index";
import { CheckCircle, Home } from "lucide-react";
import { PATHS } from "@config/path";
import { useCartStore } from "@zustand/stores/cart";

interface SuccessPageProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export const SuccessPage = ({ 
  title: propTitle,
  message: propMessage,
  showHomeButton = true 
}: SuccessPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const clearCart = useCartStore((state) => state.clearCart);
  const hasClearedRef = useRef(false);
  
  useEffect(() => {
    const shouldClearFromState = Boolean(location.state?.clearCart);
    const shouldClearFromStorage = sessionStorage.getItem("bambi-clear-cart-after-payment") === "true";
    
    // Đảm bảo clear cart khi thanh toán thành công
    if ((shouldClearFromState || shouldClearFromStorage) && !hasClearedRef.current) {
      // Clear cart ngay lập tức
      clearCart();
      hasClearedRef.current = true;
      
      // Cleanup sessionStorage
      try {
        sessionStorage.removeItem("bambi-clear-cart-after-payment");
        sessionStorage.removeItem("bambi-ordered-item-ids");
        sessionStorage.removeItem("bambi-payment-redirecting");
      } catch {
        // ignore storage errors
      }
    }
    
    // Clear payment redirecting flag khi đã quay lại từ payment gateway
    try {
      sessionStorage.removeItem("bambi-payment-redirecting");
    } catch {
      // ignore storage errors
    }
  }, [location.state, clearCart]);
  
  // Lấy title và message từ location state hoặc props
  const title = location.state?.title || propTitle || "Thành công!";
  const message = location.state?.message || propMessage || "Hành động đã được thực hiện thành công.";

  const handleGoHome = () => {
    navigate(PATHS.HOME);
  };
  
  const handleGoToOrders = () => {
    navigate(PATHS.ORDERS);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-orange-50">
      <Card className="max-w-md w-full mx-auto shadow-lg border-orange-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-orange-700">{title}</h1>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center leading-relaxed">
            {message}
          </p>
          
          {showHomeButton && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleGoToOrders}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg h-11 flex items-center justify-center gap-2"
              >
                Xem đơn hàng
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full border-orange-300 hover:bg-orange-50"
              >
                <Home className="w-5 h-5 mr-2" />
                Về trang chủ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;
