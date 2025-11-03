import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { User, Mail, Phone, Calendar } from "lucide-react";

interface ProfileDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export function ProfileDetailModal({ open, onClose, user }: ProfileDetailModalProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "STAFF":
        return "Nhân viên";
      case "USER":
        return "Người dùng";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-600";
      case "STAFF":
        return "bg-blue-100 text-blue-600";
      case "USER":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl">
            Chi tiết hồ sơ cá nhân
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-lg">
                {user?.name || 'Chưa có tên'}
              </h3>
                  <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm">
                    {user?.email || 'Chưa có email'}
                  </p>
              <Badge className={`mt-1 ${getRoleColor(user?.role || '')} text-xs`}>
                {getRoleLabel(user?.role || '')}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg">
                Thông tin cơ bản
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Email</p>
                    <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-600 text-sm">
                      {user?.email || 'Chưa có email'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Số điện thoại</p>
                    <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-600 text-sm">
                      {user?.phone || 'Chưa có số điện thoại'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Ngày tạo</p>
                    <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-600 text-sm">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Không có thông tin'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-gray-800 text-lg">
                Thông tin hệ thống
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">ID tài khoản</span>
                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-600 text-sm">#{user?.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Vai trò</span>
                  <Badge className={`${getRoleColor(user?.role || '')} text-xs`}>
                    {getRoleLabel(user?.role || '')}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Trạng thái</span>
                  <Badge className={`${user?.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-xs`}>
                    {user?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">Cập nhật cuối</span>
                  <span className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-600 text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Không có thông tin'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="[font-family:'Arial-Narrow',Helvetica] font-normal"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
