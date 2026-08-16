'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createCancellationReason,
  deleteCancellationReason,
  fetchCancellationReasons,
  updateCancellationReason,
  type CancellationReason,
} from '@/lib/backstage/cancellation-reasons'
import { ORDER_STATUS_COLOR_KEYS } from '@/lib/backstage/order-status'
import {
  createOrderStatus,
  deleteOrderStatus,
  fetchOrderStatuses,
  updateOrderStatus,
  type OrderStatusDefinition,
} from '@/lib/backstage/order-statuses'

export default function OrderDictionariesPage() {
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<OrderStatusDefinition[]>([])
  const [reasons, setReasons] = useState<CancellationReason[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRows, reasonRows] = await Promise.all([
        fetchOrderStatuses(false),
        fetchCancellationReasons({ activeOnly: false }),
      ])
      setStatuses(statusRows)
      setReasons(reasonRows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити довідники')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addStatus = async () => {
    const code = window.prompt('Код статусу (латиниця UPPER_SNAKE), напр. ON_HOLD')?.trim().toUpperCase()
    const nameUk = window.prompt('Назва (uk)')?.trim()
    if (!code || !nameUk) return
    try {
      await createOrderStatus({
        code,
        nameUk,
        color: 'gray',
        sortOrder: (statuses.at(-1)?.sortOrder ?? 0) + 10,
        isActive: true,
      })
      toast.success('Статус додано')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const editStatus = async (row: OrderStatusDefinition) => {
    const nameUk = window.prompt('Назва (uk)', row.nameUk)?.trim()
    if (!nameUk) return
    const externalCode = window.prompt('Код 1С/ERP (опційно)', row.externalCode ?? '') ?? row.externalCode
    const color =
      window.prompt(`Колір (${ORDER_STATUS_COLOR_KEYS.join(', ')})`, row.color)?.trim() || row.color
    const active = window.confirm('Статус активний? OK = так, Cancel = ні')
    try {
      await updateOrderStatus(row.code, {
        code: row.code,
        nameUk,
        nameEn: row.nameEn,
        nameSk: row.nameSk,
        color,
        sortOrder: row.sortOrder,
        isActive: active,
        isTerminal: row.isTerminal,
        externalCode: externalCode?.trim() || null,
      })
      toast.success('Статус оновлено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const removeStatus = async (code: string) => {
    if (!window.confirm(`Видалити статус ${code}?`)) return
    try {
      await deleteOrderStatus(code)
      toast.success('Статус видалено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const addReason = async () => {
    const code = window.prompt('Код причини (snake_case), напр. customer_changed_mind')?.trim().toLowerCase()
    const nameUk = window.prompt('Назва (uk)')?.trim()
    if (!code || !nameUk) return
    try {
      await createCancellationReason({
        code,
        nameUk,
        allowAdmin: true,
        allowUser: false,
        allowSystem: false,
        isActive: true,
        sortOrder: (reasons.at(-1)?.sortOrder ?? 0) + 10,
      })
      toast.success('Причину додано')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const editReason = async (row: CancellationReason) => {
    const nameUk = window.prompt('Назва (uk)', row.nameUk)?.trim()
    if (!nameUk) return
    const allowUser = window.confirm('Дозволити юзеру? OK = так')
    const allowSystem = window.confirm('Дозволити системі? OK = так')
    const active = window.confirm('Активна? OK = так')
    try {
      await updateCancellationReason(row.id, {
        code: row.code,
        nameUk,
        nameEn: row.nameEn,
        nameSk: row.nameSk,
        allowAdmin: true,
        allowUser,
        allowSystem,
        isActive: active,
        sortOrder: row.sortOrder,
      })
      toast.success('Причину оновлено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const removeReason = async (id: string) => {
    if (!window.confirm('Видалити причину?')) return
    try {
      await deleteCancellationReason(id)
      toast.success('Причину видалено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Статуси та скасування</h1>
          <p className="text-sm text-muted-foreground">
            Керування статусами замовлень (з полем для коду 1С/ERP) та причинами скасування.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="statuses">
            <TabsList>
              <TabsTrigger value="statuses">Статуси замовлень</TabsTrigger>
              <TabsTrigger value="reasons">Причини скасування</TabsTrigger>
            </TabsList>

            <TabsContent value="statuses" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Статуси</CardTitle>
                    <CardDescription>
                      Системні статуси не видаляються. Можна перейменовувати та задати externalCode для ERP.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={() => void addStatus()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Код</th>
                        <th className="px-4 py-3 font-medium">Назва</th>
                        <th className="px-4 py-3 font-medium">1С/ERP</th>
                        <th className="px-4 py-3 font-medium">Активний</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {statuses.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-4 py-3 font-mono text-xs">
                            {row.code}
                            {row.isSystem ? (
                              <span className="ml-2 text-muted-foreground">system</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">{row.nameUk}</td>
                          <td className="px-4 py-3 font-mono text-xs">{row.externalCode ?? '—'}</td>
                          <td className="px-4 py-3">{row.isActive ? 'Так' : 'Ні'}</td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => void editStatus(row)}>
                              Редагувати
                            </Button>
                            {!row.isSystem ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void removeStatus(row.code)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reasons" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Причини скасування</CardTitle>
                    <CardDescription>
                      Джерела: адмін / юзер / система. При скасуванні в замовленні обовʼязковий вибір причини.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={() => void addReason()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Код</th>
                        <th className="px-4 py-3 font-medium">Назва</th>
                        <th className="px-4 py-3 font-medium">Хто може</th>
                        <th className="px-4 py-3 font-medium">Активна</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {reasons.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                          <td className="px-4 py-3">{row.nameUk}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {[
                              row.allowAdmin ? 'адмін' : null,
                              row.allowUser ? 'юзер' : null,
                              row.allowSystem ? 'система' : null,
                            ]
                              .filter(Boolean)
                              .join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3">{row.isActive ? 'Так' : 'Ні'}</td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => void editReason(row)}>
                              Редагувати
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => void removeReason(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  )
}
