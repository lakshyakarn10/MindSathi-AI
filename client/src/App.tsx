import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PortalProvider } from "./contexts/PortalContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // While checking stored token, show nothing to avoid flash
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2f9c95] border-t-transparent" />
          <p className="text-sm font-medium text-[#718189]">Loading MindSaathi…</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/:rest*" component={Home} />
      <Route component={Home} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <PortalProvider>
            <TooltipProvider>
              <Toaster />
              <ProtectedRoutes />
            </TooltipProvider>
          </PortalProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
