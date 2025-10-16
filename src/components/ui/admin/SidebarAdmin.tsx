import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Menu as MenuIcon,
  MessageSquare,
  Carrot,
  Box,
  ChevronsLeft,
  ChevronsRight,
  Users
} from "lucide-react";
import { PATHS } from "@/config/path";

const navItems = [
  { to: PATHS.ADMIN, label: "Dashboard", icon: LayoutDashboard },
  { to: PATHS.ADMIN_ORDERS, label: "Quản lý Đơn hàng", icon: Package },
  { to: PATHS.ADMIN_MENU, label: "Món ăn", icon: MenuIcon },
  { to: PATHS.ADMIN_DISH_CATEGORIES, label: "Danh mục món", icon: Box },
  { to: PATHS.ADMIN_DISH_TEMPLATES, label: "Mẫu tô", icon: Box },
  { to: PATHS.ADMIN_INGREDIENTS, label: "Nguyên liệu", icon: Carrot },
  { to: PATHS.ADMIN_SOLD_INGREDIENTS, label: "Nguyên liệu đã bán", icon: Box },
  { to: PATHS.ADMIN_ACCOUNTS, label: "Quản lý Tài khoản", icon: Users },
  { to: PATHS.ADMIN_FEEDBACK, label: "Feedback", icon: MessageSquare },
];

const SidebarAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={[collapsed ? "w-16" : "w-64", "relative z-40 border-r bg-white min-h-[calc(100vh-82px)] p-3 transition-all overflow-visible"].join(" ")}> 
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

      <nav className="flex flex-col gap-1 pt-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                "group relative flex items-center px-3 py-3 rounded-md text-sm hover:bg-orange-50 transition-colors",
                collapsed ? "justify-center" : "gap-3",
                isActive ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <span
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded bg-gray-800 text-white text-xs px-2 py-1 shadow-lg z-50 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition"
              >
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;


