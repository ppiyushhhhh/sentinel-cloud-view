import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

const LogoutButton = () => {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <button
      onClick={handleLogout}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-zinc-800"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
};

export default LogoutButton;
