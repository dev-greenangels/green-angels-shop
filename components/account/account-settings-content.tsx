'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchAccountProfile,
  updateAccountProfile,
  type AccountProfile,
} from '@/lib/account/api'
import { DELIVERY_METHOD_LABELS } from '@/lib/backstage/order-status'

export function AccountSettingsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('nova-poshta-branch')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryBranch, setDeliveryBranch] = useState('')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryHouseNumber, setDeliveryHouseNumber] = useState('')

  useEffect(() => {
    void fetchAccountProfile()
      .then((data) => {
        setProfile(data)
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPatronymic(data.patronymic ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        const d = data.deliveryDefaults
        setDeliveryMethod(d?.method ?? 'nova-poshta-branch')
        setDeliveryCity(d?.city ?? '')
        setDeliveryBranch(d?.branch ?? '')
        setDeliveryStreet(d?.street ?? '')
        setDeliveryHouseNumber(d?.houseNumber ?? '')
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        patronymic: patronymic.trim(),
        email: email.trim(),
        phone: phone.trim(),
        deliveryDefaults: {
          method: deliveryMethod as 'nova-poshta-branch' | 'nova-poshta-address' | 'pickup',
          city: deliveryCity.trim(),
          branch: deliveryBranch.trim(),
          street: deliveryStreet.trim(),
          houseNumber: deliveryHouseNumber.trim(),
        },
      })
      setProfile(updated)
      toast.success(tc('profileSaved'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc('profileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">{t('contactDetails')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">{tc('lastName')}</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">{tc('firstName')}</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patronymic">{tc('patronymic')}</Label>
            <Input
              id="patronymic"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">{tc('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {profile && !profile.emailVerified && email ? (
              <p className="text-xs text-muted-foreground">{t('emailNotVerified')}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">{tc('phone')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+380..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {profile && !profile.phoneVerified && phone ? (
              <p className="text-xs text-muted-foreground">{t('phoneNotVerified')}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">{t('defaultDeliveryAddress')}</h2>
        <p className="text-sm text-muted-foreground">{t('defaultDeliveryHint')}</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('deliveryMethod')}</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DELIVERY_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {deliveryMethod !== 'pickup' ? (
            <div className="space-y-2">
              <Label htmlFor="deliveryCity">{t('citySettlement')}</Label>
              <Input
                id="deliveryCity"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
              />
            </div>
          ) : null}
          {deliveryMethod === 'nova-poshta-branch' ? (
            <div className="space-y-2">
              <Label htmlFor="deliveryBranch">{tc('branch')}</Label>
              <Input
                id="deliveryBranch"
                value={deliveryBranch}
                onChange={(e) => setDeliveryBranch(e.target.value)}
              />
            </div>
          ) : null}
          {deliveryMethod === 'nova-poshta-address' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="deliveryStreet">{tc('street')}</Label>
                <Input
                  id="deliveryStreet"
                  value={deliveryStreet}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryHouseNumber">{tc('house')}</Label>
                <Input
                  id="deliveryHouseNumber"
                  value={deliveryHouseNumber}
                  onChange={(e) => setDeliveryHouseNumber(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tc('saving')}
          </>
        ) : (
          tc('saveChanges')
        )}
      </Button>
    </form>
  )
}
