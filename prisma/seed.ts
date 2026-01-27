import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import type { MenuCategory } from "../generated/prisma/client";

// Create Prisma client with Accelerate extension
// Prisma 7 requires accelerateUrl option for Prisma Accelerate
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: "admin123", // In production, hash this!
    },
  });
  console.log(`✅ Created admin user: ${admin.username}`);

  // Define menu items
  const menuItems: Array<{ name: string; price: number; category: MenuCategory }> = [
    // Makanan (Food)
    { name: "Nasi Goreng Spesial", price: 25000, category: "MAKANAN" },
    { name: "Mie Goreng", price: 22000, category: "MAKANAN" },
    { name: "Ayam Bakar", price: 35000, category: "MAKANAN" },
    { name: "Sate Ayam (10 tusuk)", price: 30000, category: "MAKANAN" },
    { name: "Gado-gado", price: 20000, category: "MAKANAN" },
    { name: "Rendang", price: 40000, category: "MAKANAN" },
    { name: "Soto Ayam", price: 22000, category: "MAKANAN" },
    { name: "Bakso Urat", price: 25000, category: "MAKANAN" },

    // Minuman (Drinks)
    { name: "Es Teh Manis", price: 5000, category: "MINUMAN" },
    { name: "Es Jeruk", price: 8000, category: "MINUMAN" },
    { name: "Kopi Susu", price: 15000, category: "MINUMAN" },
    { name: "Jus Alpukat", price: 18000, category: "MINUMAN" },
    { name: "Es Campur", price: 15000, category: "MINUMAN" },
    { name: "Air Mineral", price: 4000, category: "MINUMAN" },
    { name: "Teh Hangat", price: 4000, category: "MINUMAN" },
    { name: "Lemon Tea", price: 10000, category: "MINUMAN" },

    // Paket (Packages)
    { name: "Paket Hemat A", price: 35000, category: "PAKET" },
    { name: "Paket Hemat B", price: 40000, category: "PAKET" },
    { name: "Paket Keluarga", price: 120000, category: "PAKET" },
    { name: "Paket Nasi + Ayam + Es Teh", price: 45000, category: "PAKET" },
    { name: "Paket Mie + Bakso + Jeruk", price: 42000, category: "PAKET" },
  ];

  // Create menu items
  for (const item of menuItems) {
    await prisma.menu.upsert({
      where: { id: `${item.category}-${item.name.replace(/\s+/g, "-").toLowerCase()}` },
      update: { price: item.price },
      create: {
        id: `${item.category}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
        name: item.name,
        price: item.price,
        category: item.category,
      },
    });
  }
  console.log(`✅ Created ${menuItems.length} menu items`);

  console.log("🎉 Seeding completed!");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
