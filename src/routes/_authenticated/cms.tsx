import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  useDailyStats,
  useOrders,
  useMenuItems,
  useMenuMutations,
} from '@/lib/queries'
import { formatCurrency } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  DollarSign,
  ShoppingBag,
  BarChart3,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Menu, MenuCategory } from '@/lib/db'
import type { OrderStatus, PaymentMethod } from '@/lib/db'

// Helper type for order items since we may not have direct access to the return type
interface OrderItem {
  menuId: string
  quantity: number
  menu: Menu
}

interface Order {
  id: string
  customerName: string
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  createdAt: string | Date
  items: Array<OrderItem>
}

export const Route = createFileRoute('/_authenticated/cms')({
  component: CMSPage,
})

function CMSPage() {
  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CMS Analytics</h1>
          <p className="text-muted-foreground">
            Transaction history and reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full min-h-14 sm:w-auto grid grid-cols-2">
          <TabsTrigger value="overview" className="text-sm">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="products" className="text-sm">
            Products
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="products" className="space-y-6">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const { data: stats } = useDailyStats()
  // Fetch more orders for the "Transaction History" table
  const { data: orders } = useOrders({ limit: 50 })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [sortConfig, setSortConfig] = useState<{
    key: 'total' | 'createdAt'
    direction: 'asc' | 'desc'
  } | null>(null)

  const filteredOrders = useMemo(() => {
    let result =
      orders?.filter((order) =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || []

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === 'total') {
          return sortConfig.direction === 'asc'
            ? a.total - b.total
            : b.total - a.total
        } else {
          return sortConfig.direction === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      })
    }
    return result
  }, [orders, searchTerm, sortConfig])

  const toggleSort = (key: 'total' | 'createdAt') => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' }
        return null // Reset sort
      }
      return { key, direction: 'asc' }
    })
  }

  const handleExport = () => {
    if (!filteredOrders.length) return

    const headers = [
      'Order ID',
      'Customer',
      'Items',
      'Total',
      'Payment Method',
      'Status',
      'Date',
    ]
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map((order) =>
        [
          order.id,
          `"${order.customerName}"`, // Quote to handle commas in names
          order.total,
          order.paymentMethod,
          order.status,
          new Date(order.createdAt).toISOString(),
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `transactions_${new Date().toISOString().split('T')[0]}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {stats?.totalOrders || 0}
            </div>
          </CardContent>
        </Card>

        {/* Menu Sales Recap */}
        <Card className="bg-card/50 border-border/50 shadow-sm col-span-1 lg:col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Selling Items (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[100px] overflow-y-auto pr-2">
              {stats?.popularItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales yet.</p>
              ) : (
                stats?.popularItems.map((item: any, i: number) => (
                  <div
                    key={i.toString()}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-4 text-center">
                        {i + 1}.
                      </span>
                      <span
                        className="text-sm font-medium truncate max-w-[120px]"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} sold{' '}
                      <span className="text-xs">
                        ({formatCurrency(item.revenue)})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">
              Transaction History
            </CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer..."
                className="pl-8 w-full sm:w-[200px] lg:w-[300px] bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 max-w-[calc(100vw-2rem)] lg:max-w-full">
          <div className="border-t border-border/50 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px] sm:w-[200px]">
                    Customer
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => toggleSort('total')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      <ArrowUpDown
                        className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'total' ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'}`}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Payment
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:text-foreground transition-colors group hidden sm:table-cell"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Date
                      <ArrowUpDown
                        className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'createdAt' ? 'opacity-100 text-primary' : 'opacity-50 group-hover:opacity-100'}`}
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredOrders as unknown as Array<Order>).map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedOrder(order as unknown as Order)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{order.customerName}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground hidden lg:inline-block">
                          ID: {order.id.slice(-6)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {order.items?.length || 0} items
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs font-normal">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'PAID' ? 'default' : 'secondary'
                        }
                        className={
                          order.status === 'SERVED'
                            ? 'bg-green-500 hover:bg-green-600'
                            : ''
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredOrders.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-48 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border/50 text-sm text-muted-foreground">
            <div>Page 1 of 1</div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  )
}

function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Transaction details for {order.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono">{order.id}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge>{order.status}</Badge>
          </div>

          <div className="border-t border-border my-2 pt-2">
            <p className="text-sm font-semibold mb-2">Items</p>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {order.items.map((item, i) => (
                <div
                  key={i.toString()}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-muted w-5 h-5 flex items-center justify-center rounded text-xs">
                      {item.quantity}x
                    </span>
                    <span>{item.menu.name}</span>
                  </div>
                  <span>{formatCurrency(item.menu.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-2 flex items-center justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const categoryConfig: Record<MenuCategory, { label: string; color: string }> = {
  MAKANAN: { label: 'Makanan', color: 'text-orange-500 bg-orange-500/10' },
  MINUMAN: { label: 'Minuman', color: 'text-blue-500 bg-blue-500/10' },
  PAKET: { label: 'Paket', color: 'text-purple-500 bg-purple-500/10' },
}

function ProductsTab() {
  const { data: products, isLoading } = useMenuItems()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const groupedProducts = useMemo(() => {
    if (!filteredProducts) return {}
    const grouped: Record<string, Array<Menu>> = {
      MAKANAN: [],
      MINUMAN: [],
      PAKET: [],
    }
    filteredProducts.forEach((p) => {
      if (grouped[p.category]) grouped[p.category].push(p)
    })
    return grouped
  }, [filteredProducts])

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Products Management</CardTitle>
          <CardDescription>Add, edit, or remove menu items.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 w-full sm:w-[200px] lg:w-[300px] bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ProductDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            mode="create"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 max-w-[calc(100vw-2rem)] lg:max-w-full">
        <div className="space-y-8">
          {isLoading && (
            <div className="text-center py-8">Loading products...</div>
          )}

          {!isLoading &&
            Object.keys(groupedProducts).map((category) => {
              const items = groupedProducts[category as MenuCategory]
              if (items.length === 0) return null

              return (
                <div key={category} className="space-y-3">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${categoryConfig[category as MenuCategory].color}`}
                  >
                    {categoryConfig[category as MenuCategory].label}
                    <span className="ml-2 bg-background/50 px-1.5 py-0.5 rounded-full text-xs">
                      {items.length}
                    </span>
                  </div>

                  <div className="rounded-md border border-border/50 overflow-x-auto">
                    <Table className="min-w-[400px]">
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((product) => (
                          <TableRow
                            key={product.id}
                            className="hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(product.price)}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <ProductDialog mode="edit" product={product} />
                              <DeleteProductDialog product={product} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )
            })}

          {!isLoading && filteredProducts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No products found matching your search.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductDialog({
  mode,
  product,
  open,
  onOpenChange,
}: {
  mode: 'create' | 'edit'
  product?: Menu
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const { create, update } = useMenuMutations()

  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price.toString() || '')
  const [category, setCategory] = useState<MenuCategory>(
    (product?.category as MenuCategory) || 'MAKANAN',
  )

  const isSubmitting = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'create') {
        await create.mutateAsync({
          data: { name, price: Number(price), category },
        })
        toast.success('Product created successfully')
      } else if (product) {
        await update.mutateAsync({
          data: { id: product.id, name, price: Number(price), category },
        })
        toast.success('Product updated successfully')
      }
      setIsOpen(false)
      if (mode === 'create') {
        setName('')
        setPrice('')
        setCategory('MAKANAN')
      }
    } catch (error) {
      toast.error('Failed to save product')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Product' : 'Edit Product'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new menu item for your restaurant.'
              : 'Update existing menu item details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as MenuCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAKANAN">Makanan</SelectItem>
                <SelectItem value="MINUMAN">Minuman</SelectItem>
                <SelectItem value="PAKET">Paket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (IDR)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProductDialog({ product }: { product: Menu }) {
  const { remove } = useMenuMutations()
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await remove.mutateAsync({ data: product.id })
      toast.success('Product deleted successfully')
      setOpen(false)
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            <span className="font-bold"> {product.name} </span>
            from your menu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
