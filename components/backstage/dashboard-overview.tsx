'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/lib/backstage/order-status'
import { formatOrderCustomerName } from '@/lib/backstage/order-display'
import { fetchBackstageOrders } from '@/lib/backstage/orders'
import { fetchBackstageProducts } from '@/lib/backstage/products'

export function DashboardOverview() {
  const t = useTranslations('pages.overview')

  const [productCount, setProductCount] = useState('—')
  const [orderCount, setOrderCount] = useState('—')
  const [revenue, setRevenue] = useState('—')
  const [recentOrders, setRecentOrders] = useState<
    Array<{
      id: string
      orderNumber: string
      customerLabel: string
      customerEmail: string | null
      totalAmount: number
      status: keyof typeof ORDER_STATUS_LABELS
      createdAt: string
    }>
  >([])
  const [lowStock, setLowStock] = useState<
    Array<{ id: string; name: string; sku: string | null; stock: number; label: string | null }>
  >([])

  useEffect(() => {
    void fetchBackstageProducts()
      .then((products) => {
        setProductCount(String(products.length))
        setLowStock(
          products
            .filter((product) => product.stock < 50)
            .slice(0, 5)
            .map((product) => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              stock: product.stock,
              label: product.variantLabel,
            })),
        )
      })
      .catch(() => {
        setProductCount('—')
        setLowStock([])
      })
  }, [])

  useEffect(() => {
    void fetchBackstageOrders()
      .then((orders) => {
        setOrderCount(String(orders.length))
        const total = orders.reduce((sum, order) => sum + order.totalAmount, 0)
        setRevenue(`${total.toLocaleString('uk-UA')} ₴`)
        setRecentOrders(
          orders.slice(0, 5).map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerLabel: formatOrderCustomerName(order),
            customerEmail: order.customerEmail,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
          })),
        )
      })
      .catch(() => {
        setOrderCount('—')
        setRevenue('—')
        setRecentOrders([])
      })
  }, [])

  const stats = [
    { title: t('statPlants'), value: productCount, description: t('statPlantsDesc'), icon: Package },
    { title: t('statOrders'), value: orderCount, description: t('statOrdersDesc'), icon: ShoppingCart },
    { title: t('statRevenue'), value: revenue, description: t('statRevenueDesc'), icon: TrendingUp },
    {
      title: t('statCustomers'),
      value: '—',
      description: t('statCustomersSoon'),
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {t('colNumber')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {t('colCustomer')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {t('colAmount')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {t('colStatus')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      {t('colDate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{order.customerLabel}</p>
                          {order.customerEmail ? (
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">—</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {order.totalAmount.toLocaleString('uk-UA')} ₴
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('lowStock')}</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length > 0 ? (
            <div className="space-y-4">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.sku ? (
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${product.stock < 20 ? 'text-red-600' : 'text-yellow-600'}`}
                    >
                      {t('stockUnits', { count: product.stock })}
                    </p>
                    {product.label ? (
                      <p className="text-xs text-muted-foreground">{product.label}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noLowStock')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
