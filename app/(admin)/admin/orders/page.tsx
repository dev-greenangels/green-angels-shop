'use client'

import { useState } from 'react'
import { Search, Eye, Package } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { orders } from '@/lib/data'
import type { Order } from '@/lib/types'

const statusLabels: Record<string, string> = {
  pending: 'Очікує',
  processing: 'В обробці',
  shipped: 'Відправлено',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function OrderDetailsDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Замовлення {order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Статус:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <h4 className="font-semibold">Клієнт</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Ім&apos;я:</span> {order.customerName}</p>
              <p><span className="text-muted-foreground">Email:</span> {order.customerEmail}</p>
              <p><span className="text-muted-foreground">Телефон:</span> {order.customerPhone}</p>
              <p><span className="text-muted-foreground">Адреса:</span> {order.shippingAddress}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h4 className="font-semibold">Товари</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-medium">Назва</th>
                    <th className="text-center py-2 px-4 text-sm font-medium">К-сть</th>
                    <th className="text-right py-2 px-4 text-sm font-medium">Ціна</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-2 px-4 text-sm">{item.plant.name}</td>
                      <td className="py-2 px-4 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 px-4 text-sm text-right">
                        {(item.plant.price * item.quantity).toLocaleString('uk-UA')} ₴
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={2} className="py-2 px-4 text-sm font-semibold">Разом:</td>
                    <td className="py-2 px-4 text-sm font-semibold text-right">
                      {order.total.toLocaleString('uk-UA')} ₴
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Dates */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Створено: {new Date(order.createdAt).toLocaleString('uk-UA')}</span>
            <span>Оновлено: {new Date(order.updatedAt).toLocaleString('uk-UA')}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Select defaultValue={order.status}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Змінити статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Очікує</SelectItem>
                <SelectItem value="processing">В обробці</SelectItem>
                <SelectItem value="shipped">Відправлено</SelectItem>
                <SelectItem value="delivered">Доставлено</SelectItem>
                <SelectItem value="cancelled">Скасовано</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Зберегти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Замовлення
          </h1>
          <p className="text-muted-foreground">
            Відстежуйте та керуйте замовленнями
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук за номером, ім'ям або email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="pending">Очікує</SelectItem>
                  <SelectItem value="processing">В обробці</SelectItem>
                  <SelectItem value="shipped">Відправлено</SelectItem>
                  <SelectItem value="delivered">Доставлено</SelectItem>
                  <SelectItem value="cancelled">Скасовано</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Замовлення ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Номер
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Клієнт
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Товарів
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Сума
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Статус
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Дата
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} шт.
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {order.total.toLocaleString('uk-UA')} ₴
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <OrderDetailsDialog order={order} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
