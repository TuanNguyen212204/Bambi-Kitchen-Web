import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useState, useEffect } from "react";
import { isValidPhone } from "@/utils/auth-validation";
import { Save, X } from "lucide-react";
import { useAuthStore } from "@zustand/stores/auth";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

interface ProfileUpdateRequest {
  id: number;
  name: string;
  mail: string;
  phone?: string;
  role: "USER" | "STAFF" | "ADMIN";
  active: boolean;
}

export function EditProfileModal({ open, onClose, user, onSuccess }: EditProfileModalProps) {
  const { updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'USER',
  });

  // Cập nhật formData khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'USER',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Basic phone validation (optional field)
      const phoneValue = (formData.phone || "").trim();
      if (phoneValue && !isValidPhone(phoneValue)) {
        throw new Error("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
      }
      const profileData: ProfileUpdateRequest = {
        id: user?.id,
        name: formData.name,
        mail: user?.email,
        phone: phoneValue || undefined,
        role: formData.role,
        active: user?.status === 'active'
      };
      
      await updateProfile(profileData as any);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Họ và tên *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Nhập họ và tên"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                readOnly
                disabled
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Vai trò
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} disabled>
                <SelectTrigger className="bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Người dùng</SelectItem>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-blue-800 text-sm mb-2">
              Lưu ý quan trọng
            </h4>
            <ul className="[font-family:'Inter-Regular',Helvetica] font-normal text-blue-700 text-sm space-y-1">
              <li>• Thông tin có dấu * là bắt buộc</li>
              <li>• Email dùng để đăng nhập (đổi qua OTP ở trang hồ sơ)</li>
              <li>• Bạn có thể đổi Họ và tên và Số điện thoại tại đây</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="[font-family:'Arial-Narrow',Helvetica] font-normal"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button 
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 [font-family:'Arial-Narrow',Helvetica] font-normal"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
