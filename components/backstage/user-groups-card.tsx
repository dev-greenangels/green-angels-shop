'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchCustomerGroups, type CustomerGroupItem } from '@/lib/backstage/pricing'
import type { BackstageUserDetail } from '@/lib/backstage/users'

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

export function UserGroupsCard({
  user,
  onSave,
}: {
  user: BackstageUserDetail
  onSave: (groupIds: string[]) => Promise<void>
}) {
  const [groups, setGroups] = useState<CustomerGroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>(user.groupIds)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchCustomerGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSelectedIds(user.groupIds)
  }, [user.groupIds])

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const dirty = !sameIds(selectedIds, user.groupIds)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selectedIds)
      toast.success('Групи клієнта оновлено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти групи.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Групи клієнтів</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Завантаження…
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Груп клієнтів ще не створено.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted/40 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selectedIds.includes(group.id)}
                  onChange={() => toggle(group.id)}
                />
                <span>
                  <span className="font-medium">{group.name}</span>
                  {!group.isActive ? (
                    <span className="ml-1 text-xs text-muted-foreground">(вимкнена)</span>
                  ) : null}
                  {group.description ? (
                    <span className="block text-xs text-muted-foreground">{group.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        )}
        <Button
          type="button"
          size="sm"
          disabled={saving || loading || !dirty}
          onClick={() => void handleSave()}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Зберегти групи
        </Button>
      </CardContent>
    </Card>
  )
}
