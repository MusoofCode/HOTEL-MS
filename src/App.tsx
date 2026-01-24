import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SetupAdmin from "./pages/SetupAdmin";
import Login from "./pages/Login";
import { AuthProvider } from "@/auth/useAuth";
import { RequireAdmin } from "@/auth/RequireAdmin";
import { AppLayout } from "@/layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Rooms from "./pages/app/Rooms";
import Customers from "./pages/app/Customers";
import Reservations from "./pages/app/Reservations";
import Billing from "./pages/app/Billing";
import Expenses from "./pages/app/Expenses";
import Inventory from "./pages/app/Inventory";
import HR from "./pages/app/HR";
import Reports from "./pages/app/Reports";
import Settings from "./pages/app/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/setup" element={<SetupAdmin />} />
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAdmin />}>
              <Route path="/app" element={<AppLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="reservations" element={<Reservations />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="customers" element={<Customers />} />
                <Route path="billing" element={<Billing />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="hr" element={<HR />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
