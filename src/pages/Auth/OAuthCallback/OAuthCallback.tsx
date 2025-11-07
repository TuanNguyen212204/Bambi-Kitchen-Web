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
  const { setSession, setUser, clearSession } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          const errorParam = searchParams.get('error');
          if (errorParam) {
            setError('Đăng nhập bằng Google đã bị hủy hoặc có lỗi xảy ra');
          } else {
            setError('Không tìm thấy token trong URL');
          }
          setIsProcessing(false);
          setTimeout(() => {
            navigate(PATHS.LOGIN, { replace: true });
          }, 2000);
          return;
        }

        // Set token trước
        setSession(token);

        // Đợi một chút để đảm bảo token được persist và interceptor có thể đọc được
        await new Promise(resolve => setTimeout(resolve, 150));

        // Parse token để lấy thông tin tạm thời
        let userFromToken = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const rawRole = (Array.isArray(payload.roles) && payload.roles[0]) || "USER";
          // Normalize role: bỏ prefix ROLE_ nếu có
          const normalizedRole = String(rawRole).replace(/^ROLE_/i, "") as "ADMIN" | "STAFF" | "USER";
          const finalRole = (normalizedRole === "ADMIN" || normalizedRole === "STAFF" || normalizedRole === "USER") 
            ? normalizedRole 
            : "USER";
          
          userFromToken = {
            id: parseInt(payload.sub) || 0,
            name: payload.name || payload.email || 'User',
            email: payload.email || '',
            role: finalRole,
            role_id: (finalRole === 'ADMIN' ? 1 : finalRole === 'STAFF' ? 3 : 4) as 1 | 3 | 4,
          };
        } catch (err) {
          console.error('[OAuth] Error parsing token:', err);
        }

        // Gọi API /me để lấy thông tin user đầy đủ
        let finalUser = null;
        try {
          const userResponse = await bambiApi.get<{ id: number; name?: string; mail?: string; phone?: string; role?: 'ADMIN'|'STAFF'|'USER' }>(
            API_ENDPOINTS.AUTH_ME,
            {
              headers: { 
                'x-silent-error': '1', // Tắt toast tự động
                'Authorization': `Bearer ${token}` // Đảm bảo token được set vào header
              }
            }
          );
          const userMe = userResponse.data;
          
          // So khớp role giữa JWT và /me, ưu tiên vai trò THẤP HƠN để tránh escalate quyền
          const meRole = (userMe.role || "USER") as "USER" | "ADMIN" | "STAFF";
          const tokenRole = userFromToken?.role || "USER";
          const rank = (r: "USER" | "STAFF" | "ADMIN") => (r === "ADMIN" ? 3 : r === "STAFF" ? 2 : 1);
          const resolvedRole = rank(meRole) < rank(tokenRole) ? meRole : tokenRole;
          
          finalUser = {
            id: userMe.id,
            name: userMe.name || userFromToken?.name || 'User',
            email: userMe.mail || userFromToken?.email || '',
            role: resolvedRole,
            role_id: (resolvedRole === 'ADMIN' ? 1 : resolvedRole === 'STAFF' ? 3 : 4) as 1 | 3 | 4,
          };
          
          setUser(finalUser);

          if (!userMe.phone || userMe.phone.trim() === "") {
            toast.warning("Thiếu số điện thoại", {
              description: "Đăng nhập lần đầu bằng Google - vui lòng cập nhật số điện thoại và đặt mật khẩu.",
              action: { label: "Cập nhật ngay", onClick: () => navigate(PATHS.PROFILE) },
            });
          }

          // Chỉ redirect khi user hợp lệ (có id > 0)
          if (finalUser.id > 0) {
            const redirectTo = localStorage.getItem('redirectAfterLogin') || 
              (finalUser.role === 'ADMIN' ? PATHS.ADMIN : 
               finalUser.role === 'STAFF' ? PATHS.STAFF : 
               PATHS.HOME);
            localStorage.removeItem('redirectAfterLogin');
            
            toast.success("Đăng nhập thành công!");
            navigate(redirectTo, { replace: true });
          } else {
            throw new Error('User ID không hợp lệ');
          }
        } catch (apiError) {
          console.error('[OAuth] Error calling /me:', apiError);
          
          // Nếu có user từ token và hợp lệ, dùng tạm thời
          if (userFromToken && userFromToken.id > 0) {
            setUser(userFromToken);
            const redirectTo = localStorage.getItem('redirectAfterLogin') || 
              (userFromToken.role === 'ADMIN' ? PATHS.ADMIN : 
               userFromToken.role === 'STAFF' ? PATHS.STAFF : 
               PATHS.HOME);
            localStorage.removeItem('redirectAfterLogin');
            
            toast.warning("Đăng nhập thành công nhưng không thể lấy thông tin đầy đủ", {
              description: "Vui lòng tải lại trang nếu gặp vấn đề.",
            });
            navigate(redirectTo, { replace: true });
          } else {
            // Nếu không có user hợp lệ, clear session và redirect về login
            clearSession();
            setError('Không thể xác thực tài khoản. Vui lòng thử lại.');
            setIsProcessing(false);
            toast.error('Đăng nhập thất bại', {
              description: 'Không thể xác thực tài khoản. Vui lòng thử lại.',
            });
            setTimeout(() => {
              navigate(PATHS.LOGIN, { replace: true });
            }, 2000);
          }
        }
        
      } catch (err) {
        console.error('[OAuth] Unexpected error:', err);
        clearSession();
        setError('Có lỗi xảy ra khi xử lý đăng nhập');
        setIsProcessing(false);
        toast.error('Đăng nhập thất bại', {
          description: 'Có lỗi xảy ra khi xử lý đăng nhập. Vui lòng thử lại.',
        });
        setTimeout(() => {
          navigate(PATHS.LOGIN, { replace: true });
        }, 2000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setSession, setUser, clearSession]);

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
