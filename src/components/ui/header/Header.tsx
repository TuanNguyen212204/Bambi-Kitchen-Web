import { useState } from "react";
import { Badge } from "@components/ui/badge/badge";
import { LogOut, User as UserIcon, LogIn, Search, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/zustand/stores/auth";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "@assets/logo.png";
import { PATHS } from "@config/path";
import { ROLES } from "@config/routes";
import NotificationIcon from "@/components/ui/notification/NotificationIcon";
import NotificationDropdown from "@/components/ui/notification/NotificationDropdown";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
  };
  return (
    <header className="fixed top-0 left-0 w-full h-[82px] bg-white z-50 shadow-md px-0">
      <div className="max-w-[1600px] mx-auto w-full h-full flex items-center px-2">
        <div className="flex items-center space-x-3">
          <Link to="/" aria-label="Trang chủ">
            <img
              src={logo}
              alt="Bambi's Kitchen Logo"
              className="w-44 h-16 object-contain"
            />
          </Link>
        </div>

        <nav className="flex-1 hidden md:flex justify-center gap-10">
          <NavLink to={PATHS.HOME} end className={({isActive}) => `hover:text-[#ea6d27] ${isActive ? 'text-[#ea6d27] font-semibold' : 'text-[#101a24]'}`}>Home</NavLink>
          <NavLink to={"/menu"} className={({isActive}) => `hover:text-[#ea6d27] ${isActive ? 'text-[#ea6d27] font-semibold' : 'text-[#101a24]'}`}>Menu</NavLink>
          <NavLink to={PATHS.ABOUT} className={({isActive}) => `hover:text-[#ea6d27] ${isActive ? 'text-[#ea6d27] font-semibold' : 'text-[#101a24]'}`}>About Us</NavLink>
          <NavLink to={"/specials"} className={({isActive}) => `hover:text-[#ea6d27] ${isActive ? 'text-[#ea6d27] font-semibold' : 'text-[#101a24]'}`}>Our specials</NavLink>
          <NavLink to={PATHS.CONTACT} className={({isActive}) => `hover:text-[#ea6d27] ${isActive ? 'text-[#ea6d27] font-semibold' : 'text-[#101a24]'}`}>Contact</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <button className="w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50" aria-label="Tìm kiếm">
            <Search size={18} />
          </button>
          <div className="relative">
            <button className="w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50" aria-label="Giỏ hàng">
              <ShoppingCart size={18} />
            </button>
            <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea6d27] text-white p-0 flex items-center justify-center">2</Badge>
          </div>
          {isAuthenticated && (
            <div className="relative">
              <NotificationIcon 
                onClick={() => setNotificationOpen(!notificationOpen)}
              />
              <NotificationDropdown 
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
              />
            </div>
          )}
          <div className="relative">
            {isAuthenticated ? (
              <>
                <button className="w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50" onClick={toggleMenu} aria-label="Tài khoản">
                  <UserIcon size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="px-4 py-2 text-sm text-gray-600">{user?.name ?? "Đã đăng nhập"}</div>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setMenuOpen(false);
                        if (user?.role_id === ROLES.ADMIN) {
                          navigate(`${PATHS.ADMIN}/profile`);
                        } else {
                          navigate(PATHS.PROFILE);
                        }
                      }}
                    >
                      <UserIcon size={16} />
                      Thông tin người dùng
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2" onClick={handleLogout}>
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50" onClick={toggleMenu} aria-label="Đăng nhập">
                  <UserIcon size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => navigate(PATHS.LOGIN)}>
                      <LogIn size={16} />
                      Đăng nhập
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;