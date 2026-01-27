import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMenuItems,
  createMenu,
  updateMenu,
  deleteMenu
} from "./menu";
import { getOrders, getKitchenOrders, getDailyStats } from "./orders";
import type { OrderStatus } from "./db";

// Menu queries
export function useMenuItems() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: () => getMenuItems(),
    staleTime: 5 * 60 * 1000,
  });
}

// Menu mutations
export function useMenuMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const update = useMutation({
    mutationFn: updateMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  return { create, update, remove };
}

// Order queries
export function useOrders(options?: { status?: OrderStatus; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["orders", options],
    queryFn: () => getOrders({ data: options }),
    staleTime: 30 * 1000,
  });
}

// Kitchen orders with auto-refresh
export function useKitchenOrders() {
  return useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => getKitchenOrders(),
    refetchInterval: 5000,
  });
}

// Daily stats
export function useDailyStats() {
  return useQuery({
    queryKey: ["daily-stats"],
    queryFn: () => getDailyStats(),
    staleTime: 60 * 1000,
  });
}
