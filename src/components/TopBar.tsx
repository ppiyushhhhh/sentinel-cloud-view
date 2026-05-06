import { useEffect, useState } from "react";

type ServerHealth = {
  status: string;
  publicIp: string;
  uptime: string;
};

export const TopBar = () => {
  const [data, setData] = useState<ServerHealth | null>(null);

  useEffect(() => {
    fetch("/api/server-health")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 text-white">
      <div className="text-sm text-zinc-400">
        {data?.publicIp ? `Server IP: ${data.publicIp}` : "CloudOps Sentinel"}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-400 font-semibold">
          ● {data?.status || "Checking"}
        </span>
        <span className="text-zinc-400">
          Uptime: {data?.uptime || "N/A"}
        </span>
      </div>
    </div>
  );
};
