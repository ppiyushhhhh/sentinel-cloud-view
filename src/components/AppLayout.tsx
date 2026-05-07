import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { TopBar } from "./TopBar";

const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4">
        <div>
          <h1 className="text-lg font-bold">CloudOps Sentinel</h1>
          <p className="text-xs text-zinc-500">DevOps Monitoring</p>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-50 h-full">
            <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="hidden lg:block">
          <TopBar />
        </div>

        <div className="pt-20 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
