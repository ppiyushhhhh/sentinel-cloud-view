import { SidebarTrigger } from "@/components/ui/sidebar";
import { serverStatus } from "@/data/mock";
import { Circle, Wifi } from "lucide-react";

export function TopBar() {
  const isOnline = serverStatus.status === "online";
  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <Wifi className="h-3.5 w-3.5" />
          <span>{serverStatus.publicIp}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Circle className={`h-2.5 w-2.5 fill-current ${isOnline ? "text-success" : "text-critical"}`} />
          <span className={isOnline ? "text-success" : "text-critical"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Uptime: {serverStatus.uptime}
        </span>
      </div>
    </header>
  );
}
