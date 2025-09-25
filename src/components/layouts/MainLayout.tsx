import { Outlet } from "react-router-dom";
import Header from "@components/ui/header/Header";
import Footer from "@components/ui/footer/Footer";

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mt-[64px] flex-1 px-8 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
export default MainLayout;