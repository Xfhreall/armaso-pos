import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatCurrency } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import type { PaymentMethod } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Banknote,
  QrCode,
  CheckCircle2,
  Loader2,
  User,
  ShoppingBag,
  StickyNote
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/payment")({
  component: PaymentPage,
});

function PaymentPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No items in cart</h2>
            <p className="text-muted-foreground mb-6">Add items from the menu first</p>
            <Button onClick={() => navigate({ to: "/pos" })}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    cart.setPaymentMethod(method);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await createOrder({
        data: {
          customerName: cart.customerName,
          paymentMethod: cart.paymentMethod,
          notes: cart.notes || undefined,
          items: cart.items.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });

      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] });

      toast.success("Payment successful!", {
        description: `Order for ${cart.customerName} has been placed`,
      });

      cart.clearCart();
      navigate({ to: "/pos" });
    } catch (error) {
      toast.error("Payment failed", {
        description: "Please try again",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/30 to-background p-4 lg:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/pos" })}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            <p className="text-muted-foreground">Complete your order</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card className="h-max">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{cart.customerName}</span>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.menuId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted w-6 h-6 rounded text-center text-sm flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                  <StickyNote className="w-4 h-4 text-muted-foreground" />
                  Order Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add special requests or notes for the kitchen..."
                  value={cart.notes}
                  onChange={(e) => cart.setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cart.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={cart.paymentMethod === "CASH" ? "default" : "outline"}
                  className="w-full h-16 justify-start gap-4"
                  onClick={() => handlePaymentMethodChange("CASH")}
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Cash (Tunai)</p>
                    <p className="text-sm font-normal opacity-70">Pay with cash</p>
                  </div>
                  {cart.paymentMethod === "CASH" && (
                    <CheckCircle2 className="w-5 h-5 ml-auto" />
                  )}
                </Button>

                <Button
                  variant={cart.paymentMethod === "QRIS" ? "default" : "outline"}
                  className="w-full h-16 justify-start gap-4"
                  onClick={() => handlePaymentMethodChange("QRIS")}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">QRIS</p>
                    <p className="text-sm font-normal opacity-70">Scan QR code</p>
                  </div>
                  {cart.paymentMethod === "QRIS" && (
                    <CheckCircle2 className="w-5 h-5 ml-auto" />
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* QRIS Image */}
            {cart.paymentMethod === "QRIS" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="aspect-square max-w-[250px] mx-auto bg-white rounded-lg p-4 shadow-inner">
                    <img
                      src="/qr.png"
                      alt="QRIS Payment"
                      className="w-full h-full object-cover scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='100' y='100' text-anchor='middle' dominant-baseline='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'%3EQRIS Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Scan the QR code to complete payment
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Confirm Button */}
            <Button
              className="w-full h-14 text-lg"
              size="lg"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
