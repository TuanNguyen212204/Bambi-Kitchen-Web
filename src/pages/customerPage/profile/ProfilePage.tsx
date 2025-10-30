import { Card, CardContent } from "@components/ui/card/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Lock, 
  Utensils,
  Heart,
  Clock,
  MapPin,
  Gift,
  Settings
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@zustand/stores/auth";
import { bambiApi } from "@utils/api";
import { ProfileDetailModal } from "../../../components/customer/profile/ProfileDetailModal";
import { EditProfileModal } from "../../../components/customer/profile/EditProfileModal";
import { ChangePasswordModal } from "../../../components/customer/profile/ChangePasswordModal";

interface Notification {
  title?: string;
  createdAt?: string;
}

interface AccountResponse {
  id: number;
  name: string;
  mail?: string;
  phone?: string;
  role: "USER" | "STAFF" | "ADMIN";
  active: boolean;
  createAt?: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Real data states
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Use ref to track the last fetched user ID
  const lastFetchedUserIdRef = useRef<number | null>(null);
  
  // Fetch notifications separately to avoid infinite loops
  const fetchNotifications = useCallback(async (userId: number) => {
    try {
      setNotificationsLoading(true);
      const notificationsResponse = await bambiApi.get(`/api/notification/to-account/${userId}`);
      const notifications: Notification[] = Array.isArray(notificationsResponse.data) ? notificationsResponse.data : [];
      setRecentActivity(notifications.slice(0, 3));
      setNotificationsLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch user account details
  const fetchUserAccount = useCallback(async (userId: number) => {
    try {
      const accountResponse = await bambiApi.get(`/api/account/${userId}`);
      const accountData = accountResponse.data as AccountResponse;
      
      if (accountData && user) {
        const updatedUser = {
          ...user,
          email: accountData.mail || user.email,
          phone: accountData.phone || user.phone,
          status: accountData.active ? 'active' as const : 'inactive' as const,
          created_at: accountData.createAt || user.created_at
        };
        
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error fetching user account:', error);
    }
  }, [setUser, user]);

  // Only fetch data when user ID changes
  useEffect(() => {
    if (user?.id && user.id !== lastFetchedUserIdRef.current) {
      lastFetchedUserIdRef.current = user.id;
      fetchUserAccount(user.id);
      fetchNotifications(user.id);
    }
  }, [user?.id, fetchUserAccount, fetchNotifications]);


  return (
    <div className="min-h-screen bg-white py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center">
                    <Utensils className="w-12 h-12 text-white" />
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white ${
                    user?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{user?.name || 'Khách hàng'}</h2>
                  <p className="text-orange-100 text-lg mb-2">{user?.email || 'customer@bambi.com'}</p>
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                    </Badge>
                    <Badge className={`${user?.status === 'active' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'} border-0`}>
                      {user?.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowEditModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
                <Button 
                  onClick={() => setShowChangePasswordModal(true)}
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 text-white border-white/30"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Bảo mật
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-600" />
                    Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Email</span>
                      </div>
                      <p className="text-gray-900">{user?.email || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Số điện thoại</span>
                      </div>
                      <p className="text-gray-900">{user?.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Thành viên từ</span>
                      </div>
                      <p className="text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'Không xác định'}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Hoạt động cuối</span>
                      </div>
                      <p className="text-gray-900">Bây giờ</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-500" />
                    Món ăn yêu thích
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="text-gray-500">Chưa có món ăn yêu thích</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    Địa chỉ giao hàng
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-gray-700 mb-2">Địa chỉ mặc định:</p>
                    <p className="text-gray-900">Chưa cập nhật địa chỉ giao hàng</p>
                    <Button variant="outline" size="sm" className="mt-3 text-green-600 border-green-300 hover:bg-green-50">
                      <MapPin className="w-4 h-4 mr-2" />
                      Thêm địa chỉ
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Utensils className="w-5 h-5 mr-2 text-orange-600" />
                      Thông tin tài khoản
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ID tài khoản</span>
                        <span className="font-bold text-orange-600">
                          #{user?.id || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Vai trò</span>
                        <div className="flex items-center">
                          <span className="font-bold text-gray-900">
                            {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trạng thái</span>
                        <span className={`font-bold ${user?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {user?.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-orange-600" />
                      Thao tác nhanh
                    </h4>
        <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => setShowEditModal(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Chỉnh sửa hồ sơ
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => setShowChangePasswordModal(true)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Gift className="w-5 h-5 mr-2 text-purple-600" />
                      Hoạt động gần đây
                    </h4>
                    <div className="space-y-3">
                      {notificationsLoading ? (
                        <div className="text-gray-500 text-sm">Đang tải...</div>
                      ) : recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div>
                              <p className="text-sm text-gray-900">{activity.title || 'Hoạt động mới'}</p>
                              <p className="text-xs text-gray-500">
                                {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">Chưa có hoạt động gần đây</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
        </div>
      </div>
      </div>

      <ProfileDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        user={user}
      />
      
      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onSuccess={() => {
          if (user?.id) {
            fetchUserAccount(user.id);
          }
        }}
      />

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          if (user?.id) {
            fetchUserAccount(user.id);
          }
        }}
      />
    </div>
  );
}
