import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { clearAuthTokens } from "@/lib/auth";
import type { User } from "@/types";
import LoginPage from "@/pages/login";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

// Clear any existing tokens that might cause auth loops
try {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    // Try to decode the token to check if it's expired
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      // Token is expired, clear it
      clearAuthTokens();
    }
  }
} catch (error) {
  // If there's any error parsing the token, clear it
  clearAuthTokens();
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Switch>
      {user?.role === "student" && (
        <Route path="/" component={StudentDashboard} />
      )}
      {user?.role === "teacher" && (
        <Route path="/" component={TeacherDashboard} />
      )}
      {user?.role === "admin" && (
        <Route path="/" component={AdminDashboard} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
