import { useEffect, useState } from "react";

type DockerContainer = {
  name: string;
  image: string;
  status: string;
  ports: string;
};

const DockerPage = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/docker-containers")
      .then((res) => res.json())
      .then((data) => {
        setContainers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Docker data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-white">Loading Docker data...</div>;

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Docker Containers</h1>
        <p className="text-sm text-zinc-400 mt-2">Live Docker containers from EC2.</p>
      </div>

      {containers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          No Docker containers found.
        </div>
      ) : (
        <div className="space-y-4">
          {containers.map((container, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p><span className="font-semibold">Container:</span> {container.name}</p>
              <p><span className="font-semibold">Image:</span> {container.image}</p>
              <p><span className="font-semibold">Status:</span> {container.status}</p>
              <p><span className="font-semibold">Ports:</span> {container.ports || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DockerPage;
