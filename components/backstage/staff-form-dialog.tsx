'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_LABELS } from '@/lib/backstage/user-roles'
import type { CreateStaffPayload } from '@/lib/backstage/users'
import { isValidEmail } from '@/lib/validation/register-form'

const emptyForm: CreateStaffPayload = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  patronymic: '',
  role: 'MANAGER',
}

export function StaffFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateStaffPayload) => Promise<void>
}) {
  const [form, setForm] = useState<CreateStaffPayload>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setError(null)
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const email = form.email.trim().toLowerCase()
    if (!isValidEmail(email)) {
      setError('Вкажіть коректний email (логін).')
      return
    }
    if (form.password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів.')
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Вкажіть прізвище та імʼя.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        email,
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        patronymic: form.patronymic?.trim() || undefined,
        role: form.role,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити працівника.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новий працівник</DialogTitle>
          <DialogDescription>
            Email використовується як логін для входу в бек-офіс. Пароль передайте працівнику окремо.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <RequiredLabel htmlFor="staff-email">Email (логін)</RequiredLabel>
            <InputWithClear
              id="staff-email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              onClear={() => setForm((prev) => ({ ...prev, email: '' }))}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="staff-password">Пароль</RequiredLabel>
            <Input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Мінімум 8 символів"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="staff-last-name">Прізвище</RequiredLabel>
              <InputWithClear
                id="staff-last-name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, lastName: '' }))}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="staff-first-name">Ім&apos;я</RequiredLabel>
              <InputWithClear
                id="staff-first-name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, firstName: '' }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-patronymic">По батькові</Label>
            <InputWithClear
              id="staff-patronymic"
              value={form.patronymic ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, patronymic: e.target.value }))}
              onClear={() => setForm((prev) => ({ ...prev, patronymic: '' }))}
            />
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="staff-role">Роль</RequiredLabel>
            <Select
              value={form.role}
              onValueChange={(value: 'ADMIN' | 'MANAGER') =>
                setForm((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger id="staff-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">{USER_ROLE_LABELS.MANAGER}</SelectItem>
                <SelectItem value="ADMIN">{USER_ROLE_LABELS.ADMIN}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Створення…
                </>
              ) : (
                'Створити'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
