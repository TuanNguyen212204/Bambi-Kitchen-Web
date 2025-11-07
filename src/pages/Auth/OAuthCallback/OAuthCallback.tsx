import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/zustand/stores/auth";
import { PATHS } from "@config/path";
import { bambiApi } from "@utils/api-client";
import { API_ENDPOINTS } from "@utils/endpoints";
import { toast } from "sonner";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, setUser } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError('Không tìm thấy token trong URL');
          setIsProcessing(false);
          return;
        }

        setSession(token);

        let userFromToken = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userFromToken = {
            id: parseInt(payload.sub),
            name: payload.name || payload.email || 'User',
            email: payload.email || '',
            role: payload.roles?.[0] || 'USER',
            role_id: (payload.roles?.[0] === 'ADMIN' ? 1 : payload.roles?.[0] === 'STAFF' ? 3 : 4) as 1 | 3 | 4,
          };
        } catch { void 0 }

        let finalUser = null;
        try {
          const userResponse = await bambiApi.get<{ id: number; name?: string; mail?: string; phone?: string; role?: 'ADMIN'|'STAFF'|'USER' }>(API_ENDPOINTS.AUTH_ME);
          const userMe = userResponse.data;
          
          finalUser = {
            id: userMe.id,
            name: userMe.name || userFromToken?.name || 'User',
            email: userMe.mail || userFromToken?.email || '',
            role: userMe.role || userFromToken?.role || 'USER',
            role_id: (userMe.role === 'ADMIN' ? 1 : userMe.role === 'STAFF' ? 3 : 4) as 1 | 3 | 4,
          };
          
          setUser(finalUser);

          if (!userMe.phone || userMe.phone.trim() === "") {
            toast.warning("Thiếu số điện thoại", {
              description: "Đăng nhập lần đầu bằng Google - vui lòng cập nhật số điện thoại và đặt mật khẩu.",
              action: { label: "Cập nhật ngay", onClick: () => navigate(PATHS.PROFILE) },
            });
          }
        } catch {
          if (userFromToken) {
            finalUser = userFromToken;
            setUser(userFromToken);
          } else {
            finalUser = {
              id: 0,
              name: 'User',
              email: '',
              role: 'USER' as const,
              role_id: 4 as const,
            };
            setUser(finalUser);
          }
        }

        const redirectTo = localStorage.getItem('redirectAfterLogin') || 
          (finalUser?.role === 'ADMIN' ? PATHS.ADMIN : 
           finalUser?.role === 'STAFF' ? PATHS.STAFF : 
           PATHS.HOME);
        localStorage.removeItem('redirectAfterLogin');
        
        navigate(redirectTo, { replace: true });
        
      } catch {
        setError('Có lỗi xảy ra khi xử lý đăng nhập');
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setSession, setUser]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Đang xử lý đăng nhập...
          </h2>
          <p className="text-gray-600">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lỗi đăng nhập
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(PATHS.LOGIN)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
