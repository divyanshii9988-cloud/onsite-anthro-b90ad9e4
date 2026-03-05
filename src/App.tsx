import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import WalkIns from "./pages/WalkIns";
import Medicines from "./pages/Medicines";
import Inventory from "./pages/Inventory";
import BioWaste from "./pages/BioWaste";
import Ambulance from "./pages/Ambulance";
import Specialist from "./pages/Specialist";
import Prescriptions from "./pages/Prescriptions";
import AdminUsers from "./pages/AdminUsers";
import ManageCorporates from "./pages/ManageCorporates";
import EmployeeTimeline from "./pages/EmployeeTimeline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  
  // Redirect based on role
  const defaultRoute = user?.role === 'admin' ? '/dashboard' : '/walk-ins';
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/walk-ins" element={<ProtectedRoute><WalkIns /></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/biowaste" element={<ProtectedRoute><BioWaste /></ProtectedRoute>} />
      <Route path="/ambulance" element={<ProtectedRoute><Ambulance /></ProtectedRoute>} />
      <Route path="/specialist" element={<ProtectedRoute><Specialist /></ProtectedRoute>} />
      <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
      <Route path="/employee-timeline" element={<ProtectedRoute><EmployeeTimeline /></ProtectedRoute>} />
      <Route path="/admin-users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
      <Route path="/manage-corporates" element={<ProtectedRoute><ManageCorporates /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
