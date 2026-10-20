'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
import {
  fetchFlexiPriceDictionaries,
  type BackstageUserDetail,
  type FlexiPriceDictionaries,
  type UpdateUserPayload,
} from '@/lib/backstage/users'
import { isValidEmail } from '@/lib/validation/register-form'

const GROUP_NONE = '__none__'

type FormState = {
  firstName: string
  lastName: string
  patronymic: string
  email: string
  phone: string
  password: string
  role: string
  flexiFirmaKod: string
  flexiSkupCenKod: string
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
    flexiFirmaKod: user.flexiFirmaKod ?? '',
    flexiSkupCenKod: user.flexiSkupCenKod ?? '',
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
  const t = useTranslations('userFlexiPricing')
  const staff = isStaffRole(user.role)
  const [form, setForm] = useState<FormState>(() => toFormState(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dicts, setDicts] = useState<FlexiPriceDictionaries | null>(null)
  const [dictsLoading, setDictsLoading] = useState(false)

  useEffect(() => {
    const next = toFormState(user)
    if (!staff && user.role === 'GUEST' && canChangeRole) {
      next.role = 'USER'
    }
    setForm(next)
    setError(null)
    setSuccess(false)
  }, [user, staff, canChangeRole])

  const showWholesalerFlexi = !staff && (form.role === 'WHOLESALER' || user.role === 'WHOLESALER')

  useEffect(() => {
    if (!showWholesalerFlexi) return
    let cancelled = false
    setDictsLoading(true)
    fetchFlexiPriceDictionaries()
      .then((data) => {
        if (!cancelled) setDicts(data)
      })
      .catch(() => {
        if (!cancelled) setDicts(null)
      })
      .finally(() => {
        if (!cancelled) setDictsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [showWholesalerFlexi])

  const showPasswordField = !staff || canChangeStaffPassword

  const accessPreview = useMemo(() => {
    if (form.role !== 'WHOLESALER') {
      return { kind: 'retail' as const }
    }
    const firma = form.flexiFirmaKod.trim()
    const groupOverride = form.flexiSkupCenKod.trim()
    const marketDefault =
      dicts?.salesPricesWholesalerGroupKod?.trim() ||
      user.salesPricesWholesalerGroupKod?.trim() ||
      null
    const groupKod = groupOverride || marketDefault
    return {
      kind: 'wholesale' as const,
      company: Boolean(firma),
      groupKod,
      groupFromMarketDefault: Boolean(!groupOverride && marketDefault),
    }
  }, [form.role, form.flexiFirmaKod, form.flexiSkupCenKod, dicts, user.salesPricesWholesalerGroupKod])

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

    if (showWholesalerFlexi && form.role === 'WHOLESALER') {
      payload.flexiFirmaKod = form.flexiFirmaKod.trim() || null
      payload.flexiSkupCenKod = form.flexiSkupCenKod.trim() || null
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

          {showWholesalerFlexi ? (
            <section className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t('title')}</h3>
                <p className="text-xs text-muted-foreground">{t('hint')}</p>
                <p className="text-xs text-muted-foreground">{t('wholesalerOnly')}</p>
              </div>

              {dictsLoading ? (
                <p className="text-xs text-muted-foreground">{t('dictLoading')}</p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-flexi-firma">{t('firmaLabel')}</Label>
                  <InputWithClear
                    id="edit-flexi-firma"
                    list="flexi-firma-kod-options"
                    value={form.flexiFirmaKod}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, flexiFirmaKod: e.target.value }))
                    }
                    onClear={() => setForm((prev) => ({ ...prev, flexiFirmaKod: '' }))}
                    placeholder={t('firmaPlaceholder')}
                    autoComplete="off"
                  />
                  <datalist id="flexi-firma-kod-options">
                    {(dicts?.firmaKods ?? []).map((kod) => (
                      <option key={kod} value={kod} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">{t('firmaHelp')}</p>
                  {dicts && dicts.firmaKods.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('dictEmptyFirma')}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-flexi-group">{t('groupLabel')}</Label>
                  <Select
                    value={form.flexiSkupCenKod.trim() || GROUP_NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        flexiSkupCenKod: value === GROUP_NONE ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="edit-flexi-group">
                      <SelectValue placeholder={t('groupPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GROUP_NONE}>{t('groupEmpty')}</SelectItem>
                      {(dicts?.priceGroups ?? []).map((group) => (
                        <SelectItem key={group.code} value={group.code}>
                          {group.code}
                          {group.name ? ` — ${group.name}` : ''}
                        </SelectItem>
                      ))}
                      {form.flexiSkupCenKod.trim() &&
                      !(dicts?.priceGroups ?? []).some(
                        (g) => g.code === form.flexiSkupCenKod.trim(),
                      ) ? (
                        <SelectItem value={form.flexiSkupCenKod.trim()}>
                          {form.flexiSkupCenKod.trim()}
                        </SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('groupHelp')}</p>
                  {(dicts?.salesPricesWholesalerGroupKod ||
                    user.salesPricesWholesalerGroupKod) &&
                  !form.flexiSkupCenKod.trim() ? (
                    <p className="text-xs text-muted-foreground">
                      {t('groupMarketDefault', {
                        kod:
                          dicts?.salesPricesWholesalerGroupKod ||
                          user.salesPricesWholesalerGroupKod ||
                          '',
                      })}
                    </p>
                  ) : null}
                  {dicts && dicts.priceGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('dictEmptyGroup')}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1 rounded-md border border-border/50 bg-background/60 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('accessTitle')}
                </p>
                {accessPreview.kind === 'retail' ? (
                  <p className="text-sm">{t('accessRetailOnly')}</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {accessPreview.company ? <li>{t('accessCompany')}</li> : null}
                    {accessPreview.groupKod ? (
                      <li>
                        {accessPreview.groupFromMarketDefault
                          ? t('accessGroupDefault', { kod: accessPreview.groupKod })
                          : t('accessGroup', { kod: accessPreview.groupKod })}
                      </li>
                    ) : (
                      <li>{t('accessNoGroup')}</li>
                    )}
                    <li>{t('accessAll')}</li>
                  </ul>
                )}
              </div>
            </section>
          ) : null}

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
