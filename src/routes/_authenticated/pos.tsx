import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMenuItems } from "@/lib/queries";
import { useCart, formatCurrency } from "@/lib/cart";
import type { MenuCategory, Menu } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  ArrowRight,
  UtensilsCrossed,
  Coffee,
  Package
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/pos")({
  component: POSPage,
});

const categoryConfig: Record<MenuCategory, { label: string; icon: React.ReactNode; color: string }> = {
  MAKANAN: { label: "Makanan", icon: <UtensilsCrossed className="w-5 h-5" />, color: "from-orange-500 to-red-500" },
  MINUMAN: { label: "Minuman", icon: <Coffee className="w-5 h-5" />, color: "from-blue-500 to-cyan-500" },
  PAKET: { label: "Paket", icon: <Package className="w-5 h-5" />, color: "from-purple-500 to-pink-500" },
};

const categoryOrder: MenuCategory[] = ["MAKANAN", "MINUMAN", "PAKET"];

function POSPage() {
  const { data: menuItems, isLoading } = useMenuItems();
  const cart = useCart();
  const navigate = useNavigate();

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!menuItems) return {};
    const grouped: Record<MenuCategory, Menu[]> = {
      MAKANAN: [],
      MINUMAN: [],
      PAKET: [],
    };
    menuItems.forEach((item) => {
      if (grouped[item.category as MenuCategory]) {
        grouped[item.category as MenuCategory].push(item);
      }
    });
    return grouped;
  }, [menuItems]);

  const handleCheckout = () => {
    if (cart.items.length === 0 || !cart.customerName.trim()) return;
    navigate({ to: "/payment" });
  };

  // Scroll to category
  const scrollToCategory = (category: MenuCategory) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-screen">
      {/* Main Content - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Quick Category Navigation */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-border bg-card/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categoryOrder.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => scrollToCategory(category)}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm"
              >
                {categoryConfig[category].icon}
                <span className="hidden sm:inline">{categoryConfig[category].label}</span>
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs">
                  {groupedItems[category]?.length || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
          {isLoading ? (
            <MenuSkeleton />
          ) : (
            categoryOrder.map((category) => {
              const items = groupedItems[category] || [];
              if (items.length === 0) return null;

              return (
                <section key={category} id={`category-${category}`} className="scroll-mt-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${categoryConfig[category].color} text-white`}>
                      {categoryConfig[category].icon}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold">{categoryConfig[category].label}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">{items.length} item</p>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    {items.map((item) => (
                      <MenuCard key={item.id} item={item} onAdd={() => cart.addItem(item)} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <aside className="hidden lg:flex w-96 border-l border-border bg-card flex-col">
        <CartContent onCheckout={handleCheckout} />
      </aside>

      {/* Mobile Cart Drawer */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14 relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Cart
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-auto">
              <CartContent onCheckout={handleCheckout} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

function MenuCard({ item, onAdd }: { item: Menu; onAdd: () => void }) {
  const cart = useCart();
  const quantity = cart.items.find((i) => i.menuId === item.id)?.quantity || 0;

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col"
      onClick={onAdd}
    >
      {quantity > 0 && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold z-10">
          {quantity}
        </div>
      )}
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1 sm:gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2">{item.name}</h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 opacity-50 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all h-6 w-6 sm:h-8 sm:w-8"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <p className="mt-2 sm:mt-3 font-bold text-primary text-xs sm:text-base">{formatCurrency(item.price)}</p>
      </CardContent>
    </Card>
  );
}

function CartContent({ onCheckout }: { onCheckout: () => void }) {
  const cart = useCart();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Cart ({cart.itemCount} items)
        </h2>
      </div>

      {/* Customer Name */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User className="w-4 h-4" />
          Customer Name
        </div>
        <Input
          placeholder="Enter customer name"
          value={cart.customerName}
          onChange={(e) => cart.setCustomerName(e.target.value)}
        />
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {cart.items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Cart is empty</p>
            <p className="text-sm mt-1">Add items from the menu</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.menuId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => cart.updateQuantity(item.menuId, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => cart.updateQuantity(item.menuId, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => cart.removeItem(item.menuId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Footer */}
      <div className="p-4 border-t border-border bg-muted/30 space-y-4">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(cart.total)}</span>
        </div>
        <Button
          className="w-full h-12"
          size="lg"
          onClick={onCheckout}
          disabled={cart.items.length === 0 || !cart.customerName.trim()}
        >
          Checkout
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
