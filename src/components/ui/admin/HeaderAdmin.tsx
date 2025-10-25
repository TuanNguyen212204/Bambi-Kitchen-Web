import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar/avatar";
import { User, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/zustand/stores/auth";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@config/path";
import NotificationIcon from "@/components/ui/notification/NotificationIcon";
import NotificationDropdown from "@/components/ui/notification/NotificationDropdown";

const HeaderAdmin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
  };

  return (
    <header className="w-full h-[82px] bg-white border-b border-orange-200 shadow-[0px_1px_3px_#0000001a] relative">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <img
            className="w-20 h-20 object-cover"
            alt="Orange and yellow kitchen food logo"
            src={logo}
          />

          <div className="flex flex-col">
            <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-gray-800 text-xl tracking-[0] leading-[30px] whitespace-nowrap">
              Bambi's Kitchen
            </div>
            <div className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[0] leading-[21px] whitespace-nowrap">
              Trang quản lý
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="[font-family:'Inter-Medium',Helvetica] font-medium text-gray-800 text-sm text-right tracking-[0] leading-[21px] whitespace-nowrap">
            Xin chào, {user?.name ?? "Admin"}
          </div>

          <div className="relative">
            <NotificationIcon 
              onClick={() => setNotificationOpen(!notificationOpen)}
            />
            <NotificationDropdown 
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />
          </div>

          <button
            className="rounded focus:outline-none"
            onClick={toggleMenu}
            aria-label="Mở menu tài khoản"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={user?.name ?? "Admin"} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="px-4 py-2 text-sm text-gray-600 truncate">
                {user?.name ?? "Tài khoản"}
              </div>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin/profile");
                }}
              >
                <User className="w-4 h-4" />
                Thông tin cá nhân
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;


