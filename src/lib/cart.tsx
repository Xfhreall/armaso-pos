import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Menu, PaymentMethod } from "./db";

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  customerName: string;
  paymentMethod: PaymentMethod;
  notes: string;
  addItem: (menu: Menu) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  const addItem = useCallback((menu: Menu) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuId === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((menuId: string) => {
    setItems((prev) => prev.filter((item) => item.menuId !== menuId));
  }, []);

  const updateQuantity = useCallback((menuId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.menuId !== menuId));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.menuId === menuId ? { ...item, quantity } : item))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomerName("");
    setPaymentMethod("CASH");
    setNotes("");
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value= {{
    items,
      customerName,
      paymentMethod,
      notes,
      addItem,
      removeItem,
      updateQuantity,
      setCustomerName,
      setPaymentMethod,
      setNotes,
      clearCart,
      total,
      itemCount,
      }
}
    >
  { children }
  </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
