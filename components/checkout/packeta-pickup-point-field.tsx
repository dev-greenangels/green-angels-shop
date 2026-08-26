'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronsUpDown, Loader2, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { NP_COMBOBOX_ITEM_CLASS } from '@/components/checkout/np-combobox-styles'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { InputClearButton } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type PickupPoint = {
  id: string
  name: string
  street: string
  city: string
  zip: string
  kind?: 'branch' | 'box' | 'carrier'
}

type CityOption = {
  city: string
  country: string
  pointCount: number
}

export type PacketaCartFit = {
  longestSideCm?: number
  sideSumCm?: number
  weightKg?: number
  hasMeasuredItem?: boolean
}

function cityFromPickupLabel(label: string | undefined): string | null {
  if (!label?.trim()) return null
  // Format: "Name, Street, ZIP City"
  const m = label.trim().match(/,\s*[\d\s]{3,}\s+(.+)$/)
  return m?.[1]?.trim() || null
}

function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
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

function cartFitParams(cartFit?: PacketaCartFit): URLSearchParams {
  const params = new URLSearchParams()
  if (cartFit?.hasMeasuredItem) {
    if (cartFit.longestSideCm && cartFit.longestSideCm > 0) {
      params.set('longestSideCm', String(cartFit.longestSideCm))
    }
    if (cartFit.sideSumCm && cartFit.sideSumCm > 0) {
      params.set('sideSumCm', String(cartFit.sideSumCm))
    }
  }
  if (cartFit?.weightKg && cartFit.weightKg > 0) {
    params.set('weightKg', String(cartFit.weightKg))
  }
  return params
}

function ComboboxField({
  id,
  label,
  placeholder,
  value,
  disabled,
  loading,
  open,
  onOpenChange,
  onChange,
  onClear,
  emptyHint,
  loadingHint,
  error,
  children,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  disabled?: boolean
  loading?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
  onClear: () => void
  emptyHint: string
  loadingHint: string
  error?: string | null
  children: ReactNode
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const showClear = value.length > 0 && !disabled

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Input
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={`${id}-listbox`}
              type="search"
              autoComplete="off"
              disabled={disabled}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                onOpenChange(true)
              }}
              onFocus={() => {
                if (!disabled) onOpenChange(true)
              }}
              placeholder={placeholder}
              className={cn(
                checkoutInputClassName,
                'h-10',
                showClear ? 'pr-16' : 'pr-9',
              )}
              aria-busy={loading}
            />
            {showClear ? (
              <InputClearButton
                className="right-9"
                onClear={() => {
                  onClear()
                  onOpenChange(true)
                }}
              />
            ) : null}
            {loading ? (
              <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 shrink-0 opacity-50" />
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandList id={`${id}-listbox`} className="max-h-64">
              {error ? (
                <CommandEmpty>{error}</CommandEmpty>
              ) : loading ? (
                <CommandEmpty>{loadingHint}</CommandEmpty>
              ) : (
                <CommandEmpty>{emptyHint}</CommandEmpty>
              )}
              {children}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function PacketaPickupPointField({
  idPrefix,
  value,
  label,
  onChange,
  country = 'sk',
  cartFit,
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
  cartFit?: PacketaCartFit
}) {
  const t = useTranslations('checkout')

  const [cityQuery, setCityQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [cityOpen, setCityOpen] = useState(false)
  const [cities, setCities] = useState<CityOption[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [citiesError, setCitiesError] = useState<string | null>(null)

  const [pointQuery, setPointQuery] = useState('')
  const [pointOpen, setPointOpen] = useState(false)
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const [pointsError, setPointsError] = useState<string | null>(null)

  const citiesReq = useRef(0)
  const pointsReq = useRef(0)

  const selected = useMemo(
    () => (value ? splitPickupLabel(label, value) : null),
    [label, value],
  )

  const fitLongest = cartFit?.hasMeasuredItem ? cartFit.longestSideCm : undefined
  const fitSideSum = cartFit?.hasMeasuredItem ? cartFit.sideSumCm : undefined
  const fitWeight = cartFit?.weightKg
  const fitMeasured = cartFit?.hasMeasuredItem === true

  // Reset city flow when delivery country changes.
  useEffect(() => {
    setSelectedCity(null)
    setCityQuery('')
    setCities([])
    setPoints([])
    setPointQuery('')
    setCitiesError(null)
    setPointsError(null)
  }, [country])

  // City search
  useEffect(() => {
    if (!cityOpen || selectedCity) return
    const q = cityQuery.trim()
    if (q.length < 2) {
      setCities([])
      setCitiesError(null)
      setCitiesLoading(false)
      return
    }
    const current = ++citiesReq.current
    const timer = setTimeout(() => {
      setCitiesLoading(true)
      setCitiesError(null)
      void fetch(
        `/api/packeta/cities?country=${encodeURIComponent(country || 'sk')}&search=${encodeURIComponent(q)}`,
      )
        .then(async (res) => {
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(t('packetaPickupPointUnavailable'))
          if (current !== citiesReq.current) return
          setCities(Array.isArray(data) ? (data as CityOption[]) : [])
        })
        .catch(() => {
          if (current !== citiesReq.current) return
          setCities([])
          setCitiesError(t('packetaPickupPointUnavailable'))
        })
        .finally(() => {
          if (current === citiesReq.current) setCitiesLoading(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [cityQuery, cityOpen, selectedCity, country, t])

  // Load full points for selected city
  useEffect(() => {
    if (!selectedCity) {
      setPoints([])
      setPointsError(null)
      setPointsLoading(false)
      return
    }
    const current = ++pointsReq.current
    setPointsLoading(true)
    setPointsError(null)
    const params = cartFitParams({
      longestSideCm: fitLongest,
      sideSumCm: fitSideSum,
      weightKg: fitWeight,
      hasMeasuredItem: fitMeasured,
    })
    params.set('country', country || 'sk')
    params.set('city', selectedCity)
    void fetch(`/api/packeta/pickup-points?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(t('packetaPickupPointUnavailable'))
        if (current !== pointsReq.current) return
        setPoints(Array.isArray(data) ? (data as PickupPoint[]) : [])
      })
      .catch(() => {
        if (current !== pointsReq.current) return
        setPoints([])
        setPointsError(t('packetaPickupPointUnavailable'))
      })
      .finally(() => {
        if (current === pointsReq.current) setPointsLoading(false)
      })
  }, [selectedCity, country, t, fitLongest, fitSideSum, fitWeight, fitMeasured])

  const filteredPoints = useMemo(() => {
    const q = pointQuery.trim()
    if (!q) return points
    const qFold = foldText(q)
    return points.filter((p) => {
      const hay = foldText(`${p.name} ${p.street} ${p.zip} ${p.city}`)
      return hay.includes(qFold)
    })
  }, [points, pointQuery])

  const branches = useMemo(
    () =>
      filteredPoints.filter((p) => {
        const kind = p.kind ?? 'branch'
        return kind === 'branch' || kind === 'carrier'
      }),
    [filteredPoints],
  )
  const boxes = useMemo(() => filteredPoints.filter((p) => p.kind === 'box'), [filteredPoints])

  const handleSelectCity = (city: string) => {
    setSelectedCity(city)
    setCityQuery(city)
    setCityOpen(false)
    setPointQuery('')
    setCities([])
    if (value) onChange?.('', '')
  }

  const clearCity = () => {
    setSelectedCity(null)
    setCityQuery('')
    setCities([])
    setPoints([])
    setPointQuery('')
    if (value) onChange?.('', '')
  }

  const handleSelectPoint = (p: PickupPoint) => {
    const nextLabel = `${p.name}, ${p.street}, ${p.zip} ${p.city}`
    onChange?.(p.id, nextLabel, {
      zip: p.zip,
      city: p.city,
      street: p.street,
    })
    setPointQuery('')
    setPointOpen(false)
  }

  if (value && selected) {
    return (
      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {t('packetaPickupPointLabel')}
        </Label>
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-background px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
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
            onClick={() => {
              onChange?.('', '')
              const city = selectedCity || cityFromPickupLabel(label)
              if (city) {
                setSelectedCity(city)
                setCityQuery(city)
              }
            }}
          >
            {t('changePickupPoint')}
          </Button>
        </div>
      </div>
    )
  }

  const cityEmptyHint =
    cityQuery.trim().length < 2
      ? t('packetaCityHint')
      : cities.length === 0
        ? t('packetaCityEmpty')
        : t('packetaCityEmpty')

  const pointEmptyHint = !selectedCity
    ? t('packetaPointSelectCityFirst')
    : pointsLoading
      ? t('packetaPickupPointSearching')
      : pointQuery.trim() && filteredPoints.length === 0
        ? t('packetaPickupPointEmpty')
        : points.length === 0
          ? t('packetaPickupPointEmpty')
          : t('packetaPointSearchHint')

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        {t('packetaPickupPointLabel')}
      </p>

      <ComboboxField
        id={`${idPrefix}-packeta-city`}
        label={t('packetaCityLabel')}
        placeholder={t('packetaCityPlaceholder')}
        value={cityQuery}
        open={cityOpen}
        onOpenChange={(next) => {
          if (selectedCity && next) {
            // Editing city again
            setSelectedCity(null)
            setPoints([])
            setPointQuery('')
          }
          setCityOpen(next)
        }}
        onChange={(v) => {
          if (selectedCity) {
            setSelectedCity(null)
            setPoints([])
            setPointQuery('')
          }
          setCityQuery(v)
        }}
        onClear={clearCity}
        loading={citiesLoading}
        error={citiesError}
        emptyHint={cityEmptyHint}
        loadingHint={t('packetaCitySearching')}
      >
        {!citiesError &&
          !citiesLoading &&
          cities.map((c) => (
            <CommandItem
              key={c.city}
              value={c.city}
              onSelect={() => handleSelectCity(c.city)}
              className={NP_COMBOBOX_ITEM_CLASS}
            >
              <span className="font-medium text-foreground">{c.city}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {t('packetaCityPointCount', { count: c.pointCount })}
              </span>
            </CommandItem>
          ))}
      </ComboboxField>

      <ComboboxField
        id={`${idPrefix}-packeta-point`}
        label={t('packetaPointLabel')}
        placeholder={t('packetaPointPlaceholder')}
        value={pointQuery}
        disabled={!selectedCity}
        open={pointOpen}
        onOpenChange={(next) => {
          if (selectedCity) setPointOpen(next)
        }}
        onChange={setPointQuery}
        onClear={() => setPointQuery('')}
        loading={pointsLoading}
        error={pointsError}
        emptyHint={pointEmptyHint}
        loadingHint={t('packetaPickupPointSearching')}
      >
        {selectedCity && !pointsLoading && !pointsError ? (
          <>
            {branches.length > 0 ? (
              <CommandGroup heading={t('packetaPickupPointBranches')}>
                {branches.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`branch-${p.id}-${p.name}`}
                    onSelect={() => handleSelectPoint(p)}
                    className={cn(NP_COMBOBOX_ITEM_CLASS, 'flex-col items-start gap-0.5')}
                  >
                    <span className="line-clamp-2 text-sm font-medium leading-snug">
                      {p.name}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {p.street}, {p.zip} {p.city}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {branches.length > 0 && boxes.length > 0 ? <CommandSeparator /> : null}
            {boxes.length > 0 ? (
              <CommandGroup heading={t('packetaPickupPointZbox')}>
                {boxes.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`box-${p.id}-${p.name}`}
                    onSelect={() => handleSelectPoint(p)}
                    className={cn(NP_COMBOBOX_ITEM_CLASS, 'flex-col items-start gap-0.5')}
                  >
                    <span className="line-clamp-2 text-sm font-medium leading-snug">
                      {p.name}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {p.street}, {p.zip} {p.city}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </>
        ) : null}
      </ComboboxField>
    </div>
  )
}
