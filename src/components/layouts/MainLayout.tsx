import { Outlet } from "react-router-dom"

export const MainLayout = () => {
  return <div className="min-h-screen flex flex-col"><Outlet /></div>;
}
export default MainLayout;