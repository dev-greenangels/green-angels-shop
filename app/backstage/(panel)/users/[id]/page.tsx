'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { UserEditCard } from '@/components/backstage/user-edit-card'
import { UserGroupsCard } from '@/components/backstage/user-groups-card'
import { UserOrderCard } from '@/components/backstage/user-order-card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { BackstageSession } from '@/lib/backstage-auth/types'
import type { OrderStatus } from '@/lib/backstage/order-status'
import { deleteBackstageOrder, patchBackstageOrderStatus } from '@/lib/backstage/orders'
import {
  customerRoleLabel,
  isStaffRole,
  USER_ROLE_LABELS,
} from '@/lib/backstage/user-roles'
import {
  deleteBackstageUser,
  fetchBackstageUser,
  updateBackstageUser,
  updateBackstageUserGroups,
  type BackstageUserDetail,
} from '@/lib/backstage/users'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { formatPersonName } from '@/lib/format-person-name'

type DeleteMode = 'keep-orders' | 'with-orders'

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params.id
  const { locale } = useBackstageUiLocale()

  const [user, setUser] = useState<BackstageUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('keep-orders')
  const [deleting, setDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const loadUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageUser(userId)
      setUser(data)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити користувача.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/backstage/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { user?: BackstageSession | null }) => {
        if (!cancelled) setIsAdmin(data.user?.staffRole === 'ADMIN')
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBackstageUser(userId, deleteMode === 'with-orders')
      toast.success('Користувача видалено.')
      router.push('/backstage/users')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити користувача.')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const handleOrderStatusChange = async (
    orderId: string,
    status: OrderStatus,
    options?: { cancellationReasonId?: string; cancellationNote?: string | null },
  ) => {
    await patchBackstageOrderStatus(orderId, status, options)
    setUser((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        orders: prev.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      }
    })
  }

  const handleOrderDelete = async (orderId: string) => {
    await deleteBackstageOrder(orderId)
    setUser((prev) => {
      if (!prev) return prev
      const orders = prev.orders.filter((order) => order.id !== orderId)
      return {
        ...prev,
        orders,
        orderCount: orders.length,
      }
    })
  }

  const fullName = user
    ? formatPersonName(user.lastName ?? '', user.firstName ?? '', user.patronymic)
    : ''

  const staff = user ? isStaffRole(user.role) : false
  const roleLabel = user
    ? staff
      ? USER_ROLE_LABELS[user.role]
      : customerRoleLabel(user.role)
    : ''

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
              <Link href="/backstage/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                До списку
              </Link>
            </Button>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {loading ? 'Користувач' : fullName || 'Користувач'}
            </h1>
            {user ? (
              <p className="text-muted-foreground">
                {roleLabel} · зареєстровано{' '}
                {formatDateTime(user.createdAt, locale, 'date')} · {user.orderCount}{' '}
                замовлень
              </p>
            ) : null}
          </div>

          {user ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Видалити користувача
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Завантаження...
          </div>
        ) : error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : user ? (
          <>
            <UserEditCard
              user={user}
              canChangeRole={isAdmin}
              canChangeStaffPassword={isAdmin}
              onSave={async (payload) => {
                const updated = await updateBackstageUser(userId, payload)
                setUser(updated)
              }}
            />

            <UserGroupsCard
              user={user}
              onSave={async (groupIds) => {
                const updated = await updateBackstageUserGroups(userId, groupIds)
                setUser(updated)
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Замовлення</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.orders.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Замовлень немає.
                  </p>
                ) : (
                  <div className="space-y-3 p-4">
                    {user.orders.map((order) => (
                      <UserOrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleOrderStatusChange}
                        onDelete={handleOrderDelete}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити користувача?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p>
                  Оберіть, що робити із замовленнями користувача{' '}
                  <span className="font-medium text-foreground">{fullName}</span>.
                </p>
                <RadioGroup
                  value={deleteMode}
                  onValueChange={(value) => setDeleteMode(value as DeleteMode)}
                  className="space-y-2"
                >
                  <label
                    htmlFor="delete-keep-orders"
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="keep-orders"
                      id="delete-keep-orders"
                      className="mt-0.5"
                    />
                    <div>
                      <Label htmlFor="delete-keep-orders" className="cursor-pointer font-medium">
                        Залишити замовлення
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Користувача буде видалено, замовлення залишаться в системі без привʼязки
                        до акаунта.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="delete-with-orders"
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-destructive/50 has-[:checked]:bg-destructive/5"
                  >
                    <RadioGroupItem
                      value="with-orders"
                      id="delete-with-orders"
                      className="mt-0.5"
                    />
                    <div>
                      <Label htmlFor="delete-with-orders" className="cursor-pointer font-medium">
                        Видалити разом із замовленнями
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Буде видалено користувача та всі його замовлення ({user?.orderCount ?? 0}{' '}
                        шт.).
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Видалення…' : 'Підтвердити видалення'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
