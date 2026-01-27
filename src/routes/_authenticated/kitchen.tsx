import { createFileRoute } from "@tanstack/react-router";
import { useKitchenOrders } from "@/lib/queries";
import { updateMultipleOrderStatus } from "@/lib/orders";
import { formatCurrency } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Loader2,
  UtensilsCrossed,
  StickyNote,
  X
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/kitchen")({
  component: KitchenPage,
});

interface KitchenOrder {
  id: string;
  customerName: string;
  total: number;
  notes?: string | null;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    menu: { name: string };
  }[];
}

function KitchenPage() {
  const { data: orders, isLoading, refetch } = useKitchenOrders();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAllOrders = () => {
    if (orders) {
      if (selectedOrders.size === orders.length) {
        setSelectedOrders(new Set());
      } else {
        setSelectedOrders(new Set(orders.map((o) => o.id)));
      }
    }
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
  };

  const handleBulkMarkServed = async () => {
    if (selectedOrders.size === 0) return;

    setIsUpdating(true);
    try {
      await updateMultipleOrderStatus({
        data: {
          orderIds: Array.from(selectedOrders),
          status: "SERVED",
        },
      });

      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast.success(`${selectedOrders.size} order(s) marked as served!`);
      setSelectedOrders(new Set());
      refetch();
    } catch (error) {
      toast.error("Failed to update orders");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasSelection = selectedOrders.size > 0;

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/30 to-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Kitchen</h1>
              <p className="text-sm text-muted-foreground">
                {orders?.length || 0} orders pending
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2 self-start sm:self-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live updates
          </Badge>
        </div>

        {/* Selection Bar */}
        {orders && orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={orders.length > 0 && selectedOrders.size === orders.length}
                onCheckedChange={selectAllOrders}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All
              </label>
            </div>

            {hasSelection && (
              <>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span className="text-sm text-muted-foreground">
                  {selectedOrders.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-muted-foreground h-8"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleBulkMarkServed}
                  disabled={isUpdating}
                  size="sm"
                  className="gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark {selectedOrders.size} as Served
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 sm:py-16 text-center">
              <UtensilsCrossed className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No pending orders</h3>
              <p className="text-sm text-muted-foreground">
                New orders will appear here automatically
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {orders?.map((order) => (
              <OrderCard
                key={order.id}
                order={order as KitchenOrder}
                isSelected={selectedOrders.has(order.id)}
                onToggleSelect={() => toggleOrderSelection(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: KitchenOrder;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function OrderCard({ order, isSelected, onToggleSelect }: OrderCardProps) {
  const timeAgo = getTimeAgo(new Date(order.createdAt));

  return (
    <Card
      className={`hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
      onClick={onToggleSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{order.customerName}</CardTitle>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {timeAgo}
              </div>
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0 text-xs">
            Paid
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-2 p-2 sm:p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 break-words">
              {order.notes}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1.5 sm:space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="bg-muted w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-medium text-xs">
                {item.quantity}
              </span>
              <span className="flex-1 truncate">{item.menu.name}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
          <span className="font-bold text-sm sm:text-base">{formatCurrency(order.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
