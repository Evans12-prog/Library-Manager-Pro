import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Books from "@/pages/books";
import Borrow from "@/pages/borrow";
import Reservations from "@/pages/reservations";
import Fines from "@/pages/fines";
import Notifications from "@/pages/notifications";
import UsersPage from "@/pages/users";
import ActivityLog from "@/pages/activity";
import Settings from "@/pages/settings";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse h-8 w-8 rounded-full bg-primary/20" />
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/" />;

  return <Component />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/books" component={() => <ProtectedRoute component={Books} />} />
        <Route path="/borrow" component={() => <ProtectedRoute component={Borrow} />} />
        <Route path="/reservations" component={() => <ProtectedRoute component={Reservations} />} />
        <Route path="/fines" component={() => <ProtectedRoute component={Fines} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
        <Route path="/users" component={() => <ProtectedRoute component={UsersPage} roles={["admin"]} />} />
        <Route path="/activity" component={() => <ProtectedRoute component={ActivityLog} roles={["admin"]} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} roles={["admin", "librarian"]} />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
