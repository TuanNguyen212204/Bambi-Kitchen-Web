import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import { Save, X, Eye, EyeOff, Lock } from "lucide-react";
import { useAuthStore } from "@zustand/stores/auth";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrors({ newPassword: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      setLoading(false);
      return;
    }
    
    try {
      const { bambiApi, API_ENDPOINTS } = await import("@utils/api");
      await bambiApi.put(API_ENDPOINTS.API_ACCOUNTS, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      const { toast } = await import("sonner");
      toast.success("Đổi mật khẩu thành công!");
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' });
      
      const { toast } = await import("sonner");
      toast.error("Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Đổi mật khẩu
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Mật khẩu hiện tại *
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Mật khẩu mới *
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-700 text-sm">
                Xác nhận mật khẩu mới *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="[font-family:'Arial-Narrow',Helvetica] font-normal text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-amber-800 text-sm mb-2">
              Yêu cầu mật khẩu
            </h4>
            <ul className="[font-family:'Inter-Regular',Helvetica] font-normal text-amber-700 text-sm space-y-1">
              <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
              <li>• Nên bao gồm chữ hoa, chữ thường và số</li>
              <li>• Tránh sử dụng thông tin cá nhân</li>
              <li>• Không chia sẻ mật khẩu với người khác</li>
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
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
