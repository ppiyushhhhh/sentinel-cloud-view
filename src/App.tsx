import ActivityLogPage from "./pages/ActivityLogPage";
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
import DatabasePage from "@/pages/DatabasePage";
import IncidentsPage from "@/pages/IncidentsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";

const queryClient = new QueryClient();

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout />
    <LogoutButton />
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/server" element={<ServerHealthPage />} />
            <Route path="/docker" element={<DockerPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/trivy" element={<TrivyPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/activity" element={<ActivityLogPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/nginx-logs" element={<NginxLogsPage />} />
            <Route path="/cleanup" element={<CleanupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/database" element={<DatabasePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
