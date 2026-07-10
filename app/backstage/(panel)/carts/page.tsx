'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search } from 'lucide-react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchBackstageCarts,
  type BackstageCartListItem,
} from '@/lib/backstage/carts'

function formatDate(value: string) {
  return new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CartKindBadge({ kind }: { kind: BackstageCartListItem['kind'] }) {
  if (kind === 'guest') {
    return <Badge variant="secondary">Гість (покинутий)</Badge>
  }
  return <Badge>Зареєстрований</Badge>
}

export default function CartsPage() {
  const [carts, setCarts] = useState<BackstageCartListItem[]>([])
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'guest' | 'user'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadCarts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageCarts({
        search: search.trim() || undefined,
        kind: kindFilter,
      })
      setCarts(data)
    } catch (err) {
      setCarts([])
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити кошики.')
    } finally {
      setLoading(false)
    }
  }, [search, kindFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCarts()
    }, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadCarts, search])

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (error) return null
    if (carts.length === 0) return 'Активних кошиків поки немає.'
    return null
  }, [loading, error, carts.length])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Кошики</h1>
            <p className="text-muted-foreground">
              Покинуті кошики гостей та кошики зареєстрованих користувачів
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadCarts()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Товар, клієнт, телефон, email або ID сесії..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={kindFilter}
                onValueChange={(value) => setKindFilter(value as typeof kindFilter)}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Тип кошика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі кошики</SelectItem>
                  <SelectItem value="guest">Гості (покинуті)</SelectItem>
                  <SelectItem value="user">Зареєстровані</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {loading && carts.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Завантаження...
          </div>
        ) : null}

        {emptyMessage ? (
          <p className="py-8 text-center text-muted-foreground">{emptyMessage}</p>
        ) : null}

        <div className="space-y-3">
          {carts.map((cart) => {
            const expanded = expandedId === cart.id
            return (
              <Card key={cart.id}>
                <CardContent className="p-4">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => setExpandedId(expanded ? null : cart.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CartKindBadge kind={cart.kind} />
                        <span className="text-sm text-muted-foreground">
                          {cart.itemCount} поз. · {cart.totalQuantity} шт.
                        </span>
                      </div>
                      {cart.kind === 'user' && cart.user ? (
                        <p className="font-medium text-foreground">
                          {cart.user.name || 'Без імені'}
                          {cart.user.phone ? ` · ${cart.user.phone}` : ''}
                          {cart.user.email ? ` · ${cart.user.email}` : ''}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Сесія: {cart.guestSessionId?.slice(0, 8)}…
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Оновлено: {formatDate(cart.updatedAt)}
                    </div>
                  </button>

                  {expanded ? (
                    <ul className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                      {cart.items.map((item) => (
                        <li
                          key={item.productVariantId}
                          className="flex justify-between gap-3 text-muted-foreground"
                        >
                          <span className="min-w-0 truncate text-foreground">
                            {item.productName}
                            {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                          </span>
                          <span className="shrink-0">{item.quantity} шт.</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
