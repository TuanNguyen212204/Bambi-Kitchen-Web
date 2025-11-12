import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@components/ui/card/card";
import { Button } from "@components/ui/button/index";
import { CheckCircle, XCircle, Home, Package } from "lucide-react";
import { PATHS } from "@config/path";
import { useCartStore } from "@zustand/stores/cart";

interface PaymentStatusParams {
  orderId?: string;
  amount?: string;
  status?: string;
  method?: string;
  transactionNo?: string;
}

const OrderStatusPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const hasClearedRef = useRef(false);

  // Lấy các tham số từ URL
  const paymentParams: PaymentStatusParams = {
    orderId: searchParams.get("orderId") || undefined,
    amount: searchParams.get("amount") || undefined,
    status: searchParams.get("status") || undefined,
    method: searchParams.get("method") || undefined,
    transactionNo: searchParams.get("transactionNo") || undefined,
  };

  // Xác định trạng thái thanh toán
  const statusUpper = paymentParams.status?.toUpperCase();
  const isSuccess = statusUpper === "SUCCESS";
  const isFailed = statusUpper === "FAILED" || 
                   statusUpper === "CANCELLED" ||
                   statusUpper === "ERROR";
  const isPending = !paymentParams.status || statusUpper === "PENDING" || statusUpper === "PROCESSING";

  // Format số tiền
  const formatAmount = (amount?: string) => {
    if (!amount) return "N/A";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numAmount);
  };

  // Format tên phương thức thanh toán
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "Không xác định";
    const methodMap: Record<string, string> = {
      VNPAY: "VNPay",
      MOMO: "MoMo",
      ZALO: "ZaloPay",
    };
    return methodMap[method.toUpperCase()] || method;
  };

  // Clear cart khi thanh toán thành công
  useEffect(() => {
    if (isSuccess && !hasClearedRef.current) {
      clearCart();
      hasClearedRef.current = true;
      // Clear payment redirecting flag
      try {
        sessionStorage.removeItem("bambi-payment-redirecting");
        sessionStorage.removeItem("bambi-clear-cart-after-payment");
      } catch {
        // ignore storage errors
      }
    }
  }, [isSuccess, clearCart]);

  const handleGoHome = () => {
    navigate(PATHS.HOME);
  };

  const handleGoToOrders = () => {
    navigate(PATHS.ORDERS);
  };

  // Hiển thị nội dung dựa trên trạng thái
  const renderContent = () => {
    // Trường hợp thành công
    if (isSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center bg-orange-50">
          <Card className="max-w-md w-full mx-auto shadow-lg border-orange-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-700">Thanh toán thành công!</h1>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                {paymentParams.orderId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-gray-900">#{paymentParams.orderId}</span>
                  </div>
                )}
                {paymentParams.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-gray-900">{formatAmount(paymentParams.amount)}</span>
                  </div>
                )}
                {paymentParams.method && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-semibold text-gray-900">{formatPaymentMethod(paymentParams.method)}</span>
                  </div>
                )}
                {paymentParams.transactionNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-semibold text-gray-900">{paymentParams.transactionNo}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-center leading-relaxed">
                Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ xử lý đơn hàng sớm nhất có thể.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleGoToOrders}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg h-11 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
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
            </CardContent>
          </Card>
        </div>
      );
    }

    // Trường hợp thất bại
    if (isFailed) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center bg-orange-50">
          <Card className="max-w-md w-full mx-auto shadow-lg border-red-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-700">Thanh toán thất bại</h1>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                {paymentParams.orderId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-gray-900">#{paymentParams.orderId}</span>
                  </div>
                )}
                {paymentParams.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-gray-900">{formatAmount(paymentParams.amount)}</span>
                  </div>
                )}
                {paymentParams.method && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-semibold text-gray-900">{formatPaymentMethod(paymentParams.method)}</span>
                  </div>
                )}
                {paymentParams.transactionNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-semibold text-gray-900">{paymentParams.transactionNo}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-center leading-relaxed">
                Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleGoToOrders}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg h-11 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
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
            </CardContent>
          </Card>
        </div>
      );
    }

    // Trường hợp đang xử lý hoặc không xác định được trạng thái
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-orange-50">
        <Card className="max-w-md w-full mx-auto shadow-lg border-gray-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-700">
              {isPending ? "Đang xử lý..." : "Thông tin thanh toán"}
            </h1>
          </CardHeader>

          <CardContent className="space-y-4">
            {paymentParams.orderId && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold text-gray-900">#{paymentParams.orderId}</span>
                </div>
                {paymentParams.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-gray-900">{formatAmount(paymentParams.amount)}</span>
                  </div>
                )}
                {paymentParams.method && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-semibold text-gray-900">{formatPaymentMethod(paymentParams.method)}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-gray-600 text-center leading-relaxed">
              {isPending
                ? "Chúng tôi đang xử lý thông tin thanh toán của bạn. Vui lòng đợi trong giây lát."
                : "Vui lòng kiểm tra lại thông tin thanh toán của bạn hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ."}
            </p>

            <div className="flex flex-col gap-3 pt-2">
              {paymentParams.orderId && (
                <Button
                  onClick={handleGoToOrders}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg h-11 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Xem đơn hàng
                </Button>
              )}

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full border-orange-300 hover:bg-orange-50"
              >
                <Home className="w-5 h-5 mr-2" />
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return renderContent();
};

export default OrderStatusPage;

