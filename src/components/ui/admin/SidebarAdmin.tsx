import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Carrot,
  Box,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Bell,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  LogOut,
} from "lucide-react";
import { PATHS } from "@/config/path";
import { useAuthStore } from "@/zustand/stores/auth";
import { useNavigate } from "react-router-dom";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> }
type Group = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; items: Item[] }

// Routes bị ẩn tạm thời (giữ lại code để sử dụng trong tương lai):
// - ADMIN_DISH_CATEGORIES: "Danh mục món"
// - ADMIN_SOLD_INGREDIENTS: "Nguyên liệu đã bán"
const HIDDEN_PATHS = [
  PATHS.ADMIN_DISH_CATEGORIES,
  PATHS.ADMIN_SOLD_INGREDIENTS,
];

const groups: Group[] = [
  {
    key: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    items: [
      { to: PATHS.ADMIN, label: "Dashboard", icon: LayoutDashboard },
      { to: PATHS.ADMIN_ORDERS, label: "Đơn hàng", icon: Package },
    ],
  },
  {
    key: "dish",
    label: "Món ăn",
    icon: UtensilsCrossed,
    items: [
      { to: PATHS.ADMIN_MENU, label: "Món ăn", icon: UtensilsCrossed },
      // Ẩn tạm thời - giữ code để sử dụng trong tương lai
      // { to: PATHS.ADMIN_DISH_CATEGORIES, label: "Danh mục món", icon: Box },
      { to: PATHS.ADMIN_DISH_TEMPLATES, label: "Mẫu tô", icon: Box },
    ],
  },
  {
    key: "ingredient",
    label: "Nguyên liệu",
    icon: Carrot,
    items: [
      { to: PATHS.ADMIN_INGREDIENT_CATEGORIES, label: "Danh mục nguyên liệu", icon: Box },
      { to: PATHS.ADMIN_INGREDIENTS, label: "Nguyên liệu", icon: Carrot },
      // Ẩn tạm thời - giữ code để sử dụng trong tương lai
      // { to: PATHS.ADMIN_SOLD_INGREDIENTS, label: "Nguyên liệu đã bán", icon: Box },
    ],
  },
  {
    key: "user",
    label: "Người dùng",
    icon: Users,
    items: [
      { to: PATHS.ADMIN_CUSTOMERS, label: "Quản lý khách hàng", icon: Users },
      { to: PATHS.ADMIN_STAFF, label: "Quản lý Staff", icon: Users },
    ],
  },
  {
    key: "communication",
    label: "Giao tiếp",
    icon: Bell,
    items: [
      { to: PATHS.ADMIN_NOTIFICATIONS, label: "Thông báo", icon: Bell },
      { to: PATHS.ADMIN_FEEDBACK, label: "Feedback", icon: MessageSquare },
    ],
  },
];

const SidebarAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const initiallyOpen = useMemo(() => {
    const path = location.pathname;
    const result: Record<string, boolean> = {};
    groups.forEach((g) => {
      result[g.key] = g.items.some((it) => path.startsWith(it.to));
    });
    return result;
  }, [location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initiallyOpen);

  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
  };

  // Update main content margin khi sidebar collapsed
  useEffect(() => {
    const mainContent = document.getElementById('admin-main');
    if (mainContent) {
      mainContent.style.marginLeft = collapsed ? '64px' : '256px';
    }
  }, [collapsed]);

  return (
    <aside className={[collapsed ? "w-16" : "w-64", "fixed left-0 top-[82px] h-[calc(100vh-82px)] z-40 border-r bg-white p-3 transition-all overflow-visible flex flex-col"].join(" ")}> 
      <div className={["flex items-center", collapsed ? "justify-center" : "justify-between", "h-10"].join(" ")}> 
        {!collapsed && (
          <div className="text-sm font-medium text-gray-700">Menu</div>
        )}
        <button
          className="p-2 rounded hover:bg-orange-50 text-gray-700"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          title={collapsed ? "Mở rộng" : "Thu nhỏ"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 pt-4 flex-1">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.key];
          return (
            <div key={group.key}>
              <button
                className={[
                  "w-full flex items-center",
                  collapsed ? "justify-center" : "justify-between",
                  "px-3 py-2 rounded-md hover:bg-orange-50 text-gray-800",
                ].join(" ")}
                onClick={() => (collapsed ? setCollapsed(false) : toggleGroup(group.key))}
                aria-expanded={isOpen}
              >
                <div className={["flex items-center", collapsed ? "" : "gap-3"].join(" ")}>
                  <GroupIcon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{group.label}</span>}
                </div>
                {!collapsed && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              </button>

              {!collapsed && isOpen && (
                <div className="mt-1 ml-2 border-l pl-2 space-y-1">
                  {group.items
                    .filter((item) => !HIDDEN_PATHS.includes(item.to)) // Ẩn các menu items đã bị disable
                    .map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end
                        className={({ isActive }) =>
                          [
                            "group flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-orange-50 transition-colors",
                            isActive ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700",
                          ].join(" ")
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </NavLink>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Nút logout ở dưới sidebar */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={[
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-red-50 transition-colors text-red-600",
            collapsed ? "justify-center" : ""
          ].join(" ")}
          title={collapsed ? "Đăng xuất" : ""}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarAdmin;


