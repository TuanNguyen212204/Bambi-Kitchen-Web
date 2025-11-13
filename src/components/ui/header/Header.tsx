import CartDropdown from "@/components/ui/cart/CartDropdown";
import CartIcon from "@/components/ui/cart/CartIcon";
import NotificationDropdown from "@/components/ui/notification/NotificationDropdown";
import NotificationIcon from "@/components/ui/notification/NotificationIcon";
import QuickOrderModal from "@/components/customer/quickorder/QuickOrderModal";
import { useAuthStore } from "@/zustand/stores/auth";
import logo from "@assets/logo.png";
import { PATHS } from "@config/path";
import { ROLES } from "@config/routes";
import { LogOut, User as UserIcon, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hàm đóng tất cả dropdowns
  const closeAllDropdowns = () => {
    setMenuOpen(false);
    setNotificationOpen(false);
    setCartOpen(false);
  };

  // Hàm mở cart dropdown và đóng các dropdown khác
  const handleCartToggle = () => {
    if (cartOpen) {
      setCartOpen(false);
    } else {
      closeAllDropdowns();
      setCartOpen(true);
    }
  };

  // Hàm mở notification dropdown và đóng các dropdown khác
  const handleNotificationToggle = () => {
    if (notificationOpen) {
      setNotificationOpen(false);
    } else {
      closeAllDropdowns();
      setNotificationOpen(true);
    }
  };

  // Hàm mở user menu dropdown và đóng các dropdown khác
  const handleMenuToggle = () => {
    if (menuOpen) {
      setMenuOpen(false);
    } else {
      closeAllDropdowns();
      setMenuOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
    closeAllDropdowns();
  };

  // Đóng tất cả dropdowns khi click vào navigation links hoặc logo
  // Note: Các dropdown component đã có logic riêng để đóng khi click bên ngoài dropdown
  // Chúng ta chỉ cần đóng khi navigate hoặc click vào các phần tử navigation

  // Đóng dropdowns khi navigate (thay đổi route)
  useEffect(() => {
    closeAllDropdowns();
  }, [location.pathname]);

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
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="relative">
              <CartIcon 
                onClick={handleCartToggle}
              />
              <CartDropdown 
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
              />
            </div>
          )}
          {isAuthenticated && (
            <div className="relative">
              <NotificationIcon 
                onClick={handleNotificationToggle}
              />
              <NotificationDropdown 
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
              />
            </div>
          )}
          {isAuthenticated ? (
            <div className="relative">
              <button 
                className="w-9 h-9 p-0 flex items-center justify-center rounded hover:bg-gray-50" 
                onClick={handleMenuToggle} 
                aria-label="Tài khoản"
              >
                <UserIcon size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="px-4 py-2 text-sm text-gray-600">{user?.name ?? "Đã đăng nhập"}</div>
                  {user?.role_id === ROLES.ADMIN && (
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        closeAllDropdowns();
                        navigate(PATHS.ADMIN);
                      }}
                    >
                      <UserIcon size={16} />
                      Admin
                    </button>
                  )}
                  {user?.role_id === ROLES.STAFF && (
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        closeAllDropdowns();
                        navigate(PATHS.ADMIN_ORDERS);
                      }}
                    >
                      <UserIcon size={16} />
                      Staff
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      closeAllDropdowns();
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
                  {user?.role_id === ROLES.CUSTOMER && (
                    <>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => {
                          closeAllDropdowns();
                          navigate(PATHS.ORDERS);
                        }}
                      >
                        <UserIcon size={16} />
                        Lịch sử đơn hàng
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => {
                          closeAllDropdowns();
                          setQuickOrderOpen(true);
                        }}
                      >
                        <Repeat size={16} />
                        Đặt lại đơn hàng
                      </button>
                    </>
                  )}
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2" 
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#ea6d27] rounded-full hover:bg-gray-50 transition-colors"
                onClick={() => navigate(PATHS.LOGIN)}
              >
                Login
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium bg-[#ea6d27] text-white rounded-full hover:bg-[#d85f1f] transition-colors"
                onClick={() => navigate(PATHS.REGISTER)}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
      {isAuthenticated && user?.role_id === ROLES.CUSTOMER && (
        <QuickOrderModal open={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} />
      )}
    </header>
  );
};

export default Header;