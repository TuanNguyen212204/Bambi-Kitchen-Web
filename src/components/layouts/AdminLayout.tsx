import { Outlet } from "react-router-dom";
import HeaderAdmin from "@ui/admin/HeaderAdmin";
import SidebarAdmin from "@ui/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <HeaderAdmin />
      <div className="flex gap-3">
        <SidebarAdmin />
        <main className="flex-1 pl-3 pr-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


