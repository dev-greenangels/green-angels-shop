'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type PickupPoint = {
  id: string
  name: string
  street: string
  city: string
  zip: string
}

function splitPickupLabel(label: string | undefined, fallbackId: string) {
  const raw = (label || fallbackId).trim()
  if (!raw) return { name: fallbackId, address: '' }
  const comma = raw.indexOf(',')
  if (comma <= 0) return { name: raw, address: '' }
  return {
    name: raw.slice(0, comma).trim(),
    address: raw.slice(comma + 1).trim(),
  }
}

export function PacketaPickupPointField({
  idPrefix,
  value,
  label,
  onChange,
  country = 'sk',
}: {
  idPrefix: string
  value?: string
  label?: string
  onChange?: (
    pickupPointId: string,
    label?: string,
    meta?: { zip?: string; city?: string; street?: string },
  ) => void
  country?: string
}) {
  const t = useTranslations('checkout')
  const [search, setSearch] = useState('')
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = useMemo(
    () => (value ? splitPickupLabel(label, value) : null),
    [label, value],
  )

  useEffect(() => {
    if (search.trim().length < 2) {
      setPoints([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      void fetch(
        `/api/packeta/pickup-points?country=${encodeURIComponent(country || 'sk')}&search=${encodeURIComponent(search.trim())}`,
      )
        .then(async (res) => {
          const data = (await res.json().catch(() => [])) as PickupPoint[] | { error?: string }
          if (!res.ok) {
            throw new Error(
              !Array.isArray(data) && data.error ? data.error : 'Packeta unavailable',
            )
          }
          if (!cancelled && Array.isArray(data)) setPoints(data)
        })
        .catch((err) => {
          if (!cancelled) {
            setPoints([])
            setError(err instanceof Error ? err.message : 'Error')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, country])

  return (
    <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
      <Label htmlFor={`${idPrefix}-packeta-pickup-point`} className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        {t('packetaPickupPointLabel')}
      </Label>
      {value && selected ? (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{selected.name}</p>
            {selected.address ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{selected.address}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => onChange?.('', '')}
          >
            {t('changePickupPoint')}
          </Button>
        </div>
      ) : (
        <>
          <input
            id={`${idPrefix}-packeta-pickup-point`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('packetaPickupPointHint')}
            className={cn(checkoutInputClassName, 'h-10')}
          />
          {loading ? <p className="text-xs text-muted-foreground">…</p> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {points.length > 0 ? (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-background p-1">
              {points.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    onClick={() => {
                      const nextLabel = `${p.name}, ${p.street}, ${p.zip} ${p.city}`
                      onChange?.(p.id, nextLabel, {
                        zip: p.zip,
                        city: p.city,
                        street: p.street,
                      })
                      setSearch('')
                      setPoints([])
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.street}, {p.zip} {p.city}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  )
}
