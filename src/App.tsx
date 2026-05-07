import CleanupPage from "./pages/CleanupPage";
import NginxLogsPage from "./pages/NginxLogsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ServerHealthPage from "@/pages/ServerHealthPage";
import DockerPage from "@/pages/DockerPage";
import PipelinePage from "@/pages/PipelinePage";
import TrivyPage from "@/pages/TrivyPage";
import ReportsPage from "@/pages/ReportsPage";
import AlertsPage from "@/pages/AlertsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/server" element={<ServerHealthPage />} />
            <Route path="/docker" element={<DockerPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/trivy" element={<TrivyPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/nginx-logs" element={<NginxLogsPage />} />
          <Route path="/cleanup" element={<CleanupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
