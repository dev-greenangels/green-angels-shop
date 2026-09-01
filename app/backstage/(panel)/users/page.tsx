'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, Plus, RefreshCw, Search, Users } from 'lucide-react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { StaffFormDialog } from '@/components/backstage/staff-form-dialog'
import type { BackstageSession } from '@/lib/backstage-auth/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { USER_ROLE_LABELS, customerRoleLabel } from '@/lib/backstage/user-roles'
import {
  createBackstageStaffMember,
  fetchBackstageUsers,
  type BackstageUserListItem,
  type BackstageUserSegment,
} from '@/lib/backstage/users'
import { cn } from '@/lib/utils'

const segmentActiveClassName =
  'bg-background text-foreground shadow-sm ring-1 ring-primary/40'

const segmentInactiveClassName =
  'text-muted-foreground hover:bg-background/60 hover:text-foreground'

const userRowClassName =
  'group flex w-full items-center gap-3 rounded-lg border border-border/80 bg-background/80 p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-background hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function UserField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const [segment, setSegment] = useState<BackstageUserSegment>('customers')
  const [users, setUsers] = useState<BackstageUserListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [canManageStaff, setCanManageStaff] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/backstage/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { user?: BackstageSession | null }) => {
        if (!cancelled) {
          setCanManageStaff(data.user?.staffRole === 'ADMIN')
        }
      })
      .catch(() => {
        if (!cancelled) setCanManageStaff(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageUsers({
        segment,
        search: search.trim() || undefined,
      })
      setUsers(data)
    } catch (err) {
      setUsers([])
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити користувачів.')
    } finally {
      setLoading(false)
    }
  }, [segment, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers()
    }, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadUsers, search])

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (error) return null
    if (users.length === 0) {
      return segment === 'customers' ? 'Покупців поки немає.' : 'Працівників поки немає.'
    }
    return null
  }, [loading, error, users.length, segment])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Користувачі</h1>
            <p className="text-muted-foreground">Покупці та працівники магазину</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {segment === 'staff' && canManageStaff ? (
              <Button onClick={() => setStaffDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Додати працівника
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Оновити
            </Button>
          </div>
        </div>

        <StaffFormDialog
          open={staffDialogOpen}
          onOpenChange={setStaffDialogOpen}
          onSubmit={async (values) => {
            await createBackstageStaffMember(values)
            await loadUsers()
          }}
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Категорія</Label>
                <div
                  role="group"
                  aria-label="Категорія користувачів"
                  className="inline-flex w-full max-w-md gap-1 rounded-lg border border-border/80 bg-muted/50 p-1 shadow-sm sm:w-auto"
                >
                  <button
                    type="button"
                    onClick={() => setSegment('customers')}
                    className={cn(
                      'min-w-0 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                      segment === 'customers'
                        ? segmentActiveClassName
                        : segmentInactiveClassName,
                    )}
                  >
                    Покупці
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegment('staff')}
                    className={cn(
                      'min-w-0 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                      segment === 'staff' ? segmentActiveClassName : segmentInactiveClassName,
                    )}
                  >
                    Працівники
                  </button>
                </div>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Пошук за ім'ям, телефоном або email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Завантаження...
              </div>
            ) : error ? (
              <p className="px-6 py-8 text-center text-sm text-destructive">{error}</p>
            ) : emptyMessage ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <Users className="h-10 w-10 opacity-40" />
                <p className="text-sm">{emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => router.push(`/backstage/users/${user.id}`)}
                    className={userRowClassName}
                  >
                    {segment === 'customers' ? (
                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-8">
                        <UserField
                          label="Роль"
                          value={customerRoleLabel(user.role)}
                        />
                        <UserField label="Прізвище" value={displayValue(user.lastName)} />
                        <UserField label="Ім'я" value={displayValue(user.firstName)} />
                        <UserField label="По батькові" value={displayValue(user.patronymic)} />
                        <UserField label="Телефон" value={displayValue(user.phone)} />
                        <UserField label="Email" value={displayValue(user.email)} />
                        <UserField
                          label="Розсилка"
                          value={
                            user.marketingSubscribed
                              ? 'Підписаний'
                              : 'Не підписаний'
                          }
                        />
                        <UserField
                          label="Замовлень"
                          value={String(user.orderCount)}
                        />
                      </div>
                    ) : (
                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <UserField
                          label="Роль"
                          value={USER_ROLE_LABELS[user.role] ?? user.role}
                        />
                        <UserField label="Прізвище" value={displayValue(user.lastName)} />
                        <UserField label="Ім'я" value={displayValue(user.firstName)} />
                        <UserField label="Email" value={displayValue(user.email)} />
                        <UserField label="Телефон" value={displayValue(user.phone)} />
                      </div>
                    )}
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
