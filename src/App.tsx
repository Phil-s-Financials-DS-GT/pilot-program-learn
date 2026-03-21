
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProgressProvider } from "@/contexts/ProgressContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MinimalLayout from "@/components/layout/MinimalLayout";
import GameStateInitializer from "@/components/game/GameStateInitializer";
import Index from "./pages/Index";
import LearnPage from "./pages/LearnPage";
import EmpirePage from "./pages/EmpirePage";
import AskPhilPage from "./pages/AskPhilPage";
import { Analytics } from "@vercel/analytics/react";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ProgressProvider>
          <TooltipProvider>
            <GameStateInitializer />
            <Toaster />
            <BrowserRouter>
              <ProtectedRoute>
                <MinimalLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/empire" element={<EmpirePage />} />
                    <Route path="/learn" element={<LearnPage />} />
                    <Route path="/ask-phil" element={<AskPhilPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MinimalLayout>
              </ProtectedRoute>
            </BrowserRouter>
          </TooltipProvider>
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
