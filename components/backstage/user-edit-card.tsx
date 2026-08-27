'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  CUSTOMER_ROLE_OPTIONS,
  STAFF_ROLE_OPTIONS,
  customerRoleLabel,
  isStaffRole,
} from '@/lib/backstage/user-roles'
import type { BackstageUserDetail, UpdateUserPayload } from '@/lib/backstage/users'
import { isValidEmail } from '@/lib/validation/register-form'

type FormState = {
  firstName: string
  lastName: string
  patronymic: string
  email: string
  phone: string
  password: string
  role: string
}

function toFormState(user: BackstageUserDetail): FormState {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    patronymic: user.patronymic ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
    role: user.role,
  }
}

export function UserEditCard({
  user,
  canChangeRole,
  canChangeStaffPassword,
  onSave,
}: {
  user: BackstageUserDetail
  canChangeRole: boolean
  canChangeStaffPassword: boolean
  onSave: (payload: UpdateUserPayload) => Promise<void>
}) {
  const staff = isStaffRole(user.role)
  const [form, setForm] = useState<FormState>(() => toFormState(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const next = toFormState(user)
    if (!staff && user.role === 'GUEST' && canChangeRole) {
      next.role = 'USER'
    }
    setForm(next)
    setError(null)
    setSuccess(false)
  }, [user, staff, canChangeRole])

  const showPasswordField = !staff || canChangeStaffPassword

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const email = form.email.trim().toLowerCase()
    if (!email || !isValidEmail(email)) {
      setError('Вкажіть коректний email.')
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Вкажіть прізвище та імʼя.')
      return
    }
    if (form.password && form.password.length < 8) {
      setError('Новий пароль має містити щонайменше 8 символів.')
      return
    }

    const payload: UpdateUserPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      patronymic: form.patronymic.trim() || null,
      email,
      phone: form.phone.trim() || null,
    }

    if (form.password.trim()) {
      payload.password = form.password
    }

    if (canChangeRole && form.role !== user.role) {
      payload.role = form.role as UpdateUserPayload['role']
    }

    setSaving(true)
    try {
      await onSave(payload)
      setForm((prev) => ({ ...prev, password: '' }))
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти зміни.')
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = staff ? STAFF_ROLE_OPTIONS : CUSTOMER_ROLE_OPTIONS

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редагування профілю</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="edit-last-name">Прізвище</RequiredLabel>
              <InputWithClear
                id="edit-last-name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, lastName: '' }))}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="edit-first-name">Ім&apos;я</RequiredLabel>
              <InputWithClear
                id="edit-first-name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, firstName: '' }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-patronymic">По батькові</Label>
            <InputWithClear
              id="edit-patronymic"
              value={form.patronymic}
              onChange={(e) => setForm((prev) => ({ ...prev, patronymic: e.target.value }))}
              onClear={() => setForm((prev) => ({ ...prev, patronymic: '' }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="edit-email">Email (логін)</RequiredLabel>
              <InputWithClear
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, email: '' }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Телефон</Label>
              <InputWithClear
                id="edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                onClear={() => setForm((prev) => ({ ...prev, phone: '' }))}
                placeholder="+…"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль</Label>
              {canChangeRole ? (
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm font-medium">
                  {staff
                    ? roleOptions.find((o) => o.value === form.role)?.label
                    : customerRoleLabel(user.role)}
                </p>
              )}
            </div>

            {showPasswordField ? (
              <div className="space-y-2">
                <Label htmlFor="edit-password">Новий пароль</Label>
                <Input
                  id="edit-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Залиште порожнім, щоб не змінювати"
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-700" role="status">
              Зміни збережено.
            </p>
          ) : null}

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Збереження…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Зберегти
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
