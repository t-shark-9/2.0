import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateAssignment from "./pages/CreateAssignment";
import Assignment from "./pages/Assignment";
import IdeaBuilder from "./pages/IdeaBuilder";
import Outline from "./pages/Outline";
import Draft from "./pages/Draft";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <FeatureFlagsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.PROD ? "/IBDP" : "/"}>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/assignment/new" element={<CreateAssignment />} />
                <Route path="/assignment/:id" element={<Assignment />} />
                <Route path="/assignment/:id/plan" element={<IdeaBuilder />} />
                <Route path="/assignment/:id/outline" element={<Outline />} />
                <Route path="/assignment/:id/draft" element={<Draft />} />
                <Route path="/admin" element={<AdminPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </FeatureFlagsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
