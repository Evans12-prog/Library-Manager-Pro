import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Book, 
  Users, 
  Library, 
  Calendar, 
  CreditCard, 
  Bell, 
  Activity, 
  Settings, 
  LogOut, 
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Activity, roles: ["admin", "librarian", "student"] },
  { title: "Books Catalog", href: "/books", icon: Book, roles: ["admin", "librarian", "student"] },
  { title: "Borrowing", href: "/borrow", icon: Library, roles: ["admin", "librarian", "student"] },
  { title: "Reservations", href: "/reservations", icon: Calendar, roles: ["admin", "librarian", "student"] },
  { title: "Fines", href: "/fines", icon: CreditCard, roles: ["admin", "librarian", "student"] },
  { title: "Notifications", href: "/notifications", icon: Bell, roles: ["admin", "librarian", "student"] },
  { title: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { title: "Activity Log", href: "/activity", icon: Activity, roles: ["admin"] },
  { title: "System Setup", href: "/settings", icon: Settings, roles: ["admin", "librarian"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (!user) return <>{children}</>;

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <BookOpen className="h-6 w-6 mr-3 text-sidebar-primary" />
          <span className="font-serif font-bold text-xl tracking-tight">SmartLib Pro</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start h-10 px-3", 
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs uppercase">
              {user.name.substring(0, 2)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="md:hidden h-16 bg-background border-b flex items-center justify-between px-4">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            <span className="font-serif font-bold text-lg">SmartLib</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 top-16 z-50 bg-background border-b flex flex-col p-4">
            <nav className="space-y-2 flex-1">
              {filteredNavItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      className="w-full justify-start h-12"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </nav>
            <Button variant="outline" className="w-full justify-start mt-4" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
