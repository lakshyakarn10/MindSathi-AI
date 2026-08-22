import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PortalProvider } from "./contexts/PortalContext";
import Home from "./pages/Home";

function Router() {
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
        <PortalProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PortalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
