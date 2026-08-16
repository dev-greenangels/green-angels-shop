'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/lib/backstage/order-status'
import { formatOrderCustomerName } from '@/lib/backstage/order-display'
import { fetchBackstageOrders, fetchBackstageOrdersSummary } from '@/lib/backstage/orders'
import { fetchBackstageProducts } from '@/lib/backstage/products'
import { fetchBackstageUsersCount } from '@/lib/backstage/users'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTime } from '@/lib/i18n/format-datetime'

type SectionStatus = 'loading' | 'ready' | 'error'

type RecentOrderRow = {
  id: string
  orderNumber: string
  customerLabel: string
  customerEmail: string | null
  totalAmount: number
  status: keyof typeof ORDER_STATUS_LABELS
  createdAt: string
}

type LowStockRow = {
  id: string
  name: string
  sku: string | null
  stock: number
  label: string | null
}

function sectionErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export function DashboardOverview() {
  const t = useTranslations('pages.overview')
  const tc = useTranslations('common')
  const { locale } = useBackstageUiLocale()

  const [productsStatus, setProductsStatus] = useState<SectionStatus>('loading')
  const [productsError, setProductsError] = useState<string | null>(null)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [lowStock, setLowStock] = useState<LowStockRow[]>([])

  const [customersStatus, setCustomersStatus] = useState<SectionStatus>('loading')
  const [customersError, setCustomersError] = useState<string | null>(null)
  const [customerCount, setCustomerCount] = useState<number | null>(null)

  const [ordersStatus, setOrdersStatus] = useState<SectionStatus>('loading')
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [orderCount, setOrderCount] = useState<number | null>(null)
  const [revenue, setRevenue] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([])

  const [reloadToken, setReloadToken] = useState(0)

  const loadProducts = useCallback(async () => {
    setProductsStatus('loading')
    setProductsError(null)
    try {
      const products = await fetchBackstageProducts()
      setProductCount(products.length)
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
      setProductsStatus('ready')
    } catch (err) {
      setProductCount(null)
      setLowStock([])
      setProductsError(sectionErrorMessage(err, t('loadError')))
      setProductsStatus('error')
    }
  }, [t])

  const loadCustomers = useCallback(async () => {
    setCustomersStatus('loading')
    setCustomersError(null)
    try {
      const total = await fetchBackstageUsersCount('customers')
      setCustomerCount(total)
      setCustomersStatus('ready')
    } catch (err) {
      setCustomerCount(null)
      setCustomersError(sectionErrorMessage(err, t('loadError')))
      setCustomersStatus('error')
    }
  }, [t])

  const loadOrders = useCallback(async () => {
    setOrdersStatus('loading')
    setOrdersError(null)
    try {
      const [summary, recent] = await Promise.all([
        fetchBackstageOrdersSummary(),
        fetchBackstageOrders({ page: 1, pageSize: 5 }),
      ])
      setOrderCount(summary.totalOrders)
      const currency = summary.currency === 'UAH' ? '₴' : summary.currency
      setRevenue(`${summary.totalRevenue.toLocaleString('uk-UA')} ${currency}`)
      setRecentOrders(
        recent.items.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerLabel: formatOrderCustomerName(order),
          customerEmail: order.customerEmail,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        })),
      )
      setOrdersStatus('ready')
    } catch (err) {
      setOrderCount(null)
      setRevenue(null)
      setRecentOrders([])
      setOrdersError(sectionErrorMessage(err, t('loadError')))
      setOrdersStatus('error')
    }
  }, [t])

  useEffect(() => {
    void loadProducts()
    void loadCustomers()
    void loadOrders()
  }, [loadProducts, loadCustomers, loadOrders, reloadToken])

  const retryAll = () => setReloadToken((n) => n + 1)

  const stats = [
    {
      key: 'plants',
      title: t('statPlants'),
      description: t('statPlantsDesc'),
      icon: Package,
      status: productsStatus,
      error: productsError,
      onRetry: loadProducts,
      value: productCount != null ? String(productCount) : null,
    },
    {
      key: 'orders',
      title: t('statOrders'),
      description: t('statOrdersDesc'),
      icon: ShoppingCart,
      status: ordersStatus,
      error: ordersError,
      onRetry: loadOrders,
      value: orderCount != null ? String(orderCount) : null,
    },
    {
      key: 'revenue',
      title: t('statRevenue'),
      description: t('statRevenueDesc'),
      icon: TrendingUp,
      status: ordersStatus,
      error: ordersError,
      onRetry: loadOrders,
      value: revenue,
    },
    {
      key: 'customers',
      title: t('statCustomers'),
      description: t('statCustomersDesc'),
      icon: Users,
      status: customersStatus,
      error: customersError,
      onRetry: loadCustomers,
      value: customerCount != null ? String(customerCount) : null,
    },
  ] as const

  const allFailed =
    productsStatus === 'error' &&
    customersStatus === 'error' &&
    ordersStatus === 'error'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {allFailed ? (
        <AccountPageError message={t('loadError')} onRetry={retryAll} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              {stat.status === 'loading' ? (
                <div className="flex items-center gap-2 text-muted-foreground" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span className="text-sm">{tc('loading')}</span>
                </div>
              ) : stat.status === 'error' ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{stat.error ?? t('loadError')}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void stat.onRetry()}>
                    {tc('retry')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersStatus === 'loading' ? (
            <AccountPageLoading />
          ) : ordersStatus === 'error' ? (
            <AccountPageError message={ordersError ?? t('loadError')} onRetry={() => void loadOrders()} />
          ) : recentOrders.length > 0 ? (
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
                        {formatDateTime(order.createdAt, locale, 'date')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AccountPageEmpty icon={ShoppingCart} title={t('noOrders')} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('lowStock')}</CardTitle>
        </CardHeader>
        <CardContent>
          {productsStatus === 'loading' ? (
            <AccountPageLoading />
          ) : productsStatus === 'error' ? (
            <AccountPageError
              message={productsError ?? t('loadError')}
              onRetry={() => void loadProducts()}
            />
          ) : lowStock.length > 0 ? (
            <div className="space-y-4">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{product.name}</p>
                    {product.sku ? (
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
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
            <AccountPageEmpty icon={Package} title={t('noLowStock')} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
