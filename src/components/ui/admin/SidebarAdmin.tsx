import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/ingredients", label: "Ingredients" },
  { to: "/admin/feedback", label: "Feedback" },
  { to: "/admin/settings", label: "Settings" },
];

const SidebarAdmin = () => {
  return (
    <aside className="w-64 border-r bg-card sticky top-0 h-screen p-3">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors",
                isActive ? "bg-muted font-medium" : "",
              ].join(" ")
            }
          >
            <span className="h-2 w-2 rounded-full bg-foreground/60" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;


