import { Outlet } from "react-router-dom";
import HeaderAdmin from "@ui/admin/HeaderAdmin";
import SidebarAdmin from "@ui/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <HeaderAdmin />
      <div className="flex gap-3 pt-[82px]">
        <SidebarAdmin />
        <main id="admin-main" className="flex-1 pl-3 pr-3 pt-4 md:pt-6 min-h-screen overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


