import { createFileRoute, redirect, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { getAuthSession, logout } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Store,
  ChefHat,
  BarChart3,
  LogOut,
  Menu as MenuIcon
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session.isLoggedIn) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/pos", icon: Store, label: "POS" },
  { to: "/kitchen", icon: ChefHat, label: "Kitchen" },
  { to: "/cms", icon: BarChart3, label: "CMS" },
];

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <CartProvider>
      <div className="min-h-screen relative bg-background flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r max-h-screen sticky top-0 left-0s border-border bg-card flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Armaso</h1>
                <p className="text-xs text-muted-foreground">POS System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-primary [&.active]:text-primary-foreground"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {session.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{session.username}</span>
              </div>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="font-bold">Armaso</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col h-full py-6">
                    <nav className="flex-1 space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-primary [&.active]:text-primary-foreground"
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </nav>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {session.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{session.username}</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:overflow-auto pt-16 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </CartProvider>
  );
}
