'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ReferralProgramForm } from '@/components/backstage/referral-program-form'
import {
  fetchBackstageReferralProgram,
  updateBackstageReferralProgram,
  type UpsertReferralProgramPayload,
} from '@/lib/backstage/referrals'
import { toast } from '@/lib/toast'

const EMPTY_PROGRAM: UpsertReferralProgramPayload = {
  name: 'Запроси друга',
  isActive: false,
  refereeDiscountType: 'PERCENT',
  refereeDiscountValue: 10,
  referrerPoints: 100,
  minOrderSubtotal: null,
  maxRefereeDiscount: null,
  cookieDays: 30,
  pointsExpireDays: null,
}

export default function BackstageReferralsPage() {
  const [program, setProgram] = useState<UpsertReferralProgramPayload>(EMPTY_PROGRAM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baseline, setBaseline] = useState<string | null>(null)
  const isDirty = useMemo(
    () => Boolean(baseline && JSON.stringify(program) !== baseline),
    [program, baseline],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageReferralProgram()
      if (data) {
        const next = {
          name: data.name,
          isActive: data.isActive,
          refereeDiscountType: data.refereeDiscountType,
          refereeDiscountValue: data.refereeDiscountValue,
          referrerPoints: data.referrerPoints,
          minOrderSubtotal: data.minOrderSubtotal,
          maxRefereeDiscount: data.maxRefereeDiscount,
          cookieDays: data.cookieDays,
          pointsExpireDays: data.pointsExpireDays,
        }
        setProgram(next)
        setBaseline(JSON.stringify(next))
      } else {
        setBaseline(JSON.stringify(EMPTY_PROGRAM))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити програму.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateBackstageReferralProgram(program)
      const next = {
        name: updated.name,
        isActive: updated.isActive,
        refereeDiscountType: updated.refereeDiscountType,
        refereeDiscountValue: updated.refereeDiscountValue,
        referrerPoints: updated.referrerPoints,
        minOrderSubtotal: updated.minOrderSubtotal,
        maxRefereeDiscount: updated.maxRefereeDiscount,
        cookieDays: updated.cookieDays,
        pointsExpireDays: updated.pointsExpireDays,
      }
      setProgram(next)
      setBaseline(JSON.stringify(next))
      toast.success('Реферальну програму збережено.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося зберегти програму.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <ReferralProgramForm program={program} onChange={setProgram} onSave={handleSave} saving={saving} isDirty={isDirty} />
      </div>
    </AdminLayout>
  )
}
