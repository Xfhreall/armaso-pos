import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";

// Get all vouchers (for admin)
export const getVouchers = createServerFn().handler(async () => {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    });
    return vouchers;
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    throw error;
  }
});

// Create voucher
export const createVoucher = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      code: string;
      discount: number;
      maxUsage?: number | null;
      expiresAt?: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const voucher = await prisma.voucher.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        maxUsage: data.maxUsage || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    return voucher;
  });

// Update voucher
export const updateVoucher = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: string;
      code: string;
      discount: number;
      isActive: boolean;
      maxUsage?: number | null;
      expiresAt?: string | null;
    }) => data
  )
  .handler(async ({ data }) => {
    const { id, ...updateData } = data;
    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        code: updateData.code.toUpperCase(),
        discount: updateData.discount,
        isActive: updateData.isActive,
        maxUsage: updateData.maxUsage || null,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : null,
      },
    });
    return voucher;
  });

// Delete voucher
export const deleteVoucher = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await prisma.voucher.delete({
      where: { id },
    });
    return { success: true };
  });

// Validate voucher (for cashier/POS)
export const validateVoucher = createServerFn({ method: "POST" })
  .inputValidator((code: string) => code)
  .handler(async ({ data: code }) => {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return { valid: false, error: "Kode voucher tidak ditemukan" };
    }

    if (!voucher.isActive) {
      return { valid: false, error: "Voucher tidak aktif" };
    }

    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return { valid: false, error: "Voucher sudah expired" };
    }

    if (voucher.maxUsage && voucher.usageCount >= voucher.maxUsage) {
      return { valid: false, error: "Voucher sudah mencapai batas penggunaan" };
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discount: voucher.discount,
      },
    };
  });

// Apply voucher to order (called after order created)
export const applyVoucher = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      voucherCode: string;
      orderId: string;
      discount: number;
    }) => data
  )
  .handler(async ({ data }) => {
    const voucher = await prisma.voucher.findUnique({
      where: { code: data.voucherCode.toUpperCase() },
    });

    if (!voucher) {
      throw new Error("Voucher not found");
    }

    // Create voucher log and increment usage count
    await prisma.$transaction([
      prisma.voucherLog.create({
        data: {
          voucherId: voucher.id,
          orderId: data.orderId,
          discount: data.discount,
        },
      }),
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    return { success: true };
  });

// Get voucher usage logs (for transparency)
export const getVoucherLogs = createServerFn().handler(async () => {
  const logs = await prisma.voucherLog.findMany({
    orderBy: { appliedAt: "desc" },
    take: 100,
    include: {
      voucher: {
        select: {
          code: true,
          discount: true,
        },
      },
      order: {
        select: {
          id: true,
          customerName: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });
  return logs;
});
