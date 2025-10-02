import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Menu as MenuIcon, 
  MessageSquare, 
  Carrot,
  Box
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Quản lý Đơn hàng", icon: Package },
  { to: "/admin/menu", label: "Menu", icon: MenuIcon },
  { to: "/admin/ingredients", label: "Thành phần", icon: Carrot },
  { to: "/admin/sold-ingredients", label: "Nguyên liệu đã bán", icon: Box },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

const SidebarAdmin = () => {
  return (
    <aside className="w-64 border-r bg-white min-h-[calc(100vh-82px)] p-3">
      <nav className="flex flex-col gap-1 pt-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-orange-50 transition-colors",
                isActive ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-700",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;


