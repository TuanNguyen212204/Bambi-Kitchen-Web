import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const HeaderAdmin = () => {
  return (
    <header className="h-16 border-b bg-background/60 backdrop-blur sticky top-0 z-40 flex items-center justify-between px-4">
      <Link to="/admin/dashboard" className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8 w-8" />
        <span className="font-semibold">Bambi Kitchen Admin</span>
      </Link>

      <button
        type="button"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-muted"
        aria-label="User"
        title="User"
      >
        <span className="text-sm">U</span>
      </button>
    </header>
  );
};

export default HeaderAdmin;


