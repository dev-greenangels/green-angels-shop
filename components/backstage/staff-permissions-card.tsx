'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import {
  fetchStaffPermissionRegistry,
  fetchUserStaffPermissions,
  saveUserStaffPermissions,
  type StaffPermissionRegistryItem,
} from '@/lib/backstage/staff-permissions'

const GROUP_ORDER = [
  'applications',
  'catalog',
  'orders',
  'customers',
  'marketing',
  'content',
  'operations',
  'administration',
  'plantstock',
] as const

export function StaffPermissionsCard({
  userId,
  targetRole,
  isAdminViewer,
}: {
  userId: string
  targetRole: string
  isAdminViewer: boolean
}) {
  const t = useTranslations('permissions')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [registry, setRegistry] = useState<StaffPermissionRegistryItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [reg, perms] = await Promise.all([
        fetchStaffPermissionRegistry(),
        fetchUserStaffPermissions(userId),
      ])
      setRegistry(reg.items)
      setSelected(new Set(perms))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, StaffPermissionRegistryItem[]>()
    for (const item of registry) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return GROUP_ORDER.map((g) => ({ group: g, items: map.get(g) ?? [] })).filter(
      (g) => g.items.length > 0,
    )
  }, [registry])

  if (targetRole === 'ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('adminFullAccess')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (targetRole !== 'MANAGER' || !isAdminViewer) {
    return null
  }

  const toggle = (key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const saved = await saveUserStaffPermissions(userId, [...selected])
      setSelected(new Set(saved))
      toast.success(t('saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          grouped.map(({ group, items }) => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                {t(`groups.${group}` as 'groups.applications')}
              </h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const id = `perm-${item.key}`
                  const checked = selected.has(item.key)
                  return (
                    <div key={item.key} className="flex items-start gap-3 rounded-md border border-border/60 p-3">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) => toggle(item.key, v === true)}
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor={id} className="cursor-pointer font-medium">
                          {t(`labels.${item.labelKey}` as 'labels.backofficeAccess')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`descriptions.${item.descriptionKey}` as 'descriptions.backofficeAccessDesc')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <Button type="button" onClick={() => void handleSave()} disabled={loading || saving}>
          {saving ? tCommon('saving') : tCommon('save')}
        </Button>
      </CardContent>
    </Card>
  )
}
