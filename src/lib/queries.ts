import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMenuItems,
  getActiveMenuItems,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuActive,
} from "./menu";
import { getOrders, getKitchenOrders, getDailyStats, getWeeklyStats } from "./orders";
import type { OrderStatus } from "./db";

// Menu queries
export function useMenuItems() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: () => getMenuItems(),
    staleTime: 5 * 60 * 1000,
  });
}

// Active menu items only (for POS)
export function useActiveMenuItems() {
  return useQuery({
    queryKey: ["menu", "active"],
    queryFn: () => getActiveMenuItems(),
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

  const toggleActive = useMutation({
    mutationFn: toggleMenuActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  return { create, update, remove, toggleActive };
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

// Weekly stats (7 days)
export function useWeeklyStats() {
  return useQuery({
    queryKey: ["weekly-stats"],
    queryFn: () => getWeeklyStats(),
    staleTime: 5 * 60 * 1000,
  });
}

// Voucher imports
import {
  getVouchers,
  getVoucherLogs,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  applyVoucher,
} from "./voucher";

// Voucher queries
export function useVouchers() {
  return useQuery({
    queryKey: ["vouchers"],
    queryFn: () => getVouchers(),
    staleTime: 60 * 1000,
  });
}

export function useVoucherLogs() {
  return useQuery({
    queryKey: ["voucher-logs"],
    queryFn: () => getVoucherLogs(),
    staleTime: 60 * 1000,
  });
}

// Voucher mutations
export function useVoucherMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });

  const update = useMutation({
    mutationFn: updateVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });

  const apply = useMutation({
    mutationFn: applyVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["voucher-logs"] });
    },
  });

  return { create, update, remove, apply };
}

// Validate voucher (returns result, not a query)
export function useValidateVoucher() {
  return useMutation({
    mutationFn: validateVoucher,
  });
}

