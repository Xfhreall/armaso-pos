import { createServerFn } from '@tanstack/react-start'
import { prisma, type PaymentMethod, type OrderStatus } from './db'

// Create a new order
export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      customerName: string
      paymentMethod: PaymentMethod
      notes?: string
      items: Array<{ menuId: string; quantity: number; price: number }>
      discount?: number
      voucherCode?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    const discount = data.discount || 0
    const total = Math.max(0, subtotal - discount)

    const order = await prisma.order.create({
      data: {
        customerName: data.customerName,
        subtotal,
        discount,
        total,
        voucherCode: data.voucherCode || null,
        paymentMethod: data.paymentMethod,
        status: 'PAID',
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    })

    return order
  })

// Get orders with optional filters
export const getOrders = createServerFn()
  .inputValidator(
    (data?: { status?: OrderStatus; search?: string; limit?: number }) => data,
  )
  .handler(async ({ data }) => {
    const orders = await prisma.order.findMany({
      where: {
        ...(data?.status && { status: data.status }),
        ...(data?.search && {
          customerName: { contains: data.search, mode: 'insensitive' },
        }),
      },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(data?.limit && { take: data.limit }),
    })

    return orders
  })

// Get kitchen orders (paid but not served)
export const getKitchenOrders = createServerFn().handler(async () => {
  const orders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: {
      items: {
        include: {
          menu: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return orders
})

// Update order status
export const updateOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: string; status: OrderStatus }) => data)
  .handler(async ({ data }) => {
    const order = await prisma.order.update({
      where: { id: data.orderId },
      data: { status: data.status },
    })

    return order
  })

// Update multiple orders status at once
export const updateMultipleOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderIds: string[]; status: OrderStatus }) => data)
  .handler(async ({ data }) => {
    const result = await prisma.order.updateMany({
      where: { id: { in: data.orderIds } },
      data: { status: data.status },
    })

    return result
  })

// Get daily stats
export const getDailyStats = createServerFn().handler(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch orders with items to calculate popular items
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
      status: { in: ['PAID', 'SERVED'] },
    },
    include: {
      items: {
        include: {
          menu: true,
        },
      },
    },
  })

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length

  // Calculate item sales
  const itemSalesMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = itemSalesMap.get(item.menuId) || {
        name: item.menu.name,
        quantity: 0,
        revenue: 0,
      }
      itemSalesMap.set(item.menuId, {
        name: existing.name,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.quantity * item.menu.price,
      })
    })
  })

  const popularItems = Array.from(itemSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity) // Sort by quantity sold
    .slice(0, 10) // Top 10

  return { totalRevenue, totalOrders, popularItems }
})

// Get weekly stats (last 7 days)
export const getWeeklyStats = createServerFn().handler(async () => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Fetch all orders from last 7 days
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
        lte: today,
      },
      status: { in: ['PAID', 'SERVED'] },
    },
    include: {
      items: {
        include: {
          menu: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group orders by date
  const dailyData: Array<{
    date: string
    orders: number
    revenue: number
  }> = []

  // Initialize all 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dailyData.push({
      date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      orders: 0,
      revenue: 0,
    })
  }

  // Aggregate orders by day
  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt)
    const dateKey = orderDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    const dayEntry = dailyData.find(d => d.date === dateKey)
    if (dayEntry) {
      dayEntry.orders += 1
      dayEntry.revenue += order.total
    }
  })

  // Calculate top items for the week
  const itemSalesMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = itemSalesMap.get(item.menuId) || {
        name: item.menu.name,
        quantity: 0,
        revenue: 0,
      }
      itemSalesMap.set(item.menuId, {
        name: existing.name,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.quantity * item.menu.price,
      })
    })
  })

  const topItems = Array.from(itemSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length

  return { dailyData, topItems, totalRevenue, totalOrders }
})
