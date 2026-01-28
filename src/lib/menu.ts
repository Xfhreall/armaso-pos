import { createServerFn } from "@tanstack/react-start";
import { prisma, type MenuCategory } from "./db";

// Get all menu items
export const getMenuItems = createServerFn().handler(async () => {
  const items = await prisma.menu.findMany({
    orderBy: { name: "asc" },
  });
  return items;
});

// Get menu items by category
export const getMenuByCategory = createServerFn()
  .inputValidator((category: MenuCategory) => category)
  .handler(async ({ data: category }) => {
    const items = await prisma.menu.findMany({
      where: { category },
      orderBy: { name: "asc" },
    });
    return items;
  });

// Create menu item
export const createMenu = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      price: number;
      category: MenuCategory;
    }) => data
  )
  .handler(async ({ data }) => {
    const item = await prisma.menu.create({
      data,
    });
    return item;
  });

// Update menu item
export const updateMenu = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: string;
      name: string;
      price: number;
      category: MenuCategory;
    }) => data
  )
  .handler(async ({ data }) => {
    const { id, ...updateData } = data;
    const item = await prisma.menu.update({
      where: { id },
      data: updateData,
    });
    return item;
  });

// Delete menu item
export const deleteMenu = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await prisma.menu.delete({
      where: { id },
    });
    return { success: true };
  });

// Toggle menu active status
export const toggleMenuActive = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data }) => {
    const item = await prisma.menu.update({
      where: { id: data.id },
      data: { isActive: data.isActive },
    });
    return item;
  });

// Get only active menu items (for POS)
export const getActiveMenuItems = createServerFn().handler(async () => {
  const items = await prisma.menu.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return items;
});
