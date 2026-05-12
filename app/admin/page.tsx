import { Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { plants, orders } from '@/lib/data'

const stats = [
  {
    title: 'Всього рослин',
    value: plants.length.toString(),
    description: 'Позицій у каталозі',
    icon: Package,
    trend: '+12%',
  },
  {
    title: 'Замовлення',
    value: orders.length.toString(),
    description: 'За останній місяць',
    icon: ShoppingCart,
    trend: '+8%',
  },
  {
    title: 'Дохід',
    value: '₴ 45,231',
    description: 'За останній місяць',
    icon: TrendingUp,
    trend: '+23%',
  },
  {
    title: 'Клієнти',
    value: '1,234',
    description: 'Зареєстровано',
    icon: Users,
    trend: '+5%',
  },
]

const recentOrders = orders.slice(0, 5)

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

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Огляд
          </h1>
          <p className="text-muted-foreground">
            Загальна статистика та останні замовлення
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-green-600 font-medium">{stat.trend}</span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Останні замовлення</CardTitle>
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
                      Сума
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Статус
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle>Низький залишок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plants.filter(p => p.stock < 50).slice(0, 5).map((plant) => (
                <div key={plant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{plant.name}</p>
                    <p className="text-sm text-muted-foreground">{plant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${plant.stock < 20 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {plant.stock} шт.
                    </p>
                    <p className="text-xs text-muted-foreground">{plant.containerSize}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
