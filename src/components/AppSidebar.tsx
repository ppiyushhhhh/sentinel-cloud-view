import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Box,
  GitBranch,
  Shield,
  FileText,
  Bell,
  Settings,
  Activity,
  Trash2,
  Database,
  AlertTriangle
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard
  },
  {
    title: "Server Health",
    url: "/server",
    icon: Server
  },
  {
    title: "Docker",
    url: "/docker",
    icon: Box
  },
  {
    title: "CI/CD Pipeline",
    url: "/pipeline",
    icon: GitBranch
  },
  {
    title: "Trivy Security",
    url: "/trivy",
    icon: Shield
  },
  {
    title: "PDF Reports",
    url: "/reports",
    icon: FileText
  },
  {
    title: "Activity Log",
    url: "/activity",
    icon: Activity
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell
  },
  {
    title: "Incidents",
    url: "/incidents",
    icon: AlertTriangle
  },
  {
    title: "Nginx Logs",
    url: "/nginx-logs",
    icon: Activity
  },
  {
    title: "Server Cleanup",
    url: "/cleanup",
    icon: Trash2
  },
  {
    title: "Database",
    url: "/database",
    icon: Database
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  }
];

type AppSidebarProps = {
  onNavigate?: () => void;
};

const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  return (
    <aside className="h-full w-72 bg-zinc-950 border-r border-zinc-800 text-white flex flex-col">
      <div className="h-20 flex items-center px-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold">CloudOps Sentinel</h1>
          <p className="text-xs text-zinc-500 mt-1">DevOps Monitoring</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppSidebar;
