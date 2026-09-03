'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import type { CartCheckoutSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type CarrierSurchargeConfig = NonNullable<
  CartCheckoutSettings['carrierSurcharges']
>[string]
type CarrierRateTier = { maxWeightKg: number; amount: number }
type SurchargeMode = CarrierSurchargeConfig['fuelMode']

const PACKETA_COUNTRIES = [
  { code: 'SK', label: 'Словаччина' },
  { code: 'CZ', label: 'Чехія' },
  { code: 'AT', label: 'Австрія' },
  { code: 'DE', label: 'Німеччина' },
  { code: 'HU', label: 'Угорщина' },
] as const

const PACKETA_SERVICES: Array<{
  method: 'packeta-box' | 'packeta-courier'
  label: string
  countries: readonly string[]
}> = [
  {
    method: 'packeta-box',
    label: 'Packeta Z-Point / Z-Box',
    countries: ['SK', 'CZ', 'HU'],
  },
  {
    method: 'packeta-courier',
    label: 'Packeta курʼєр (Home HD)',
    countries: ['SK', 'CZ', 'AT', 'DE', 'HU'],
  },
]

/** Ensure cleared country tables are written as [] so Settings deepMerge drops them. */
export function buildPacketaCarrierRateTablesPatch(
  tables: CartCheckoutSettings['carrierRateTables'] | undefined,
): NonNullable<CartCheckoutSettings['carrierRateTables']> {
  const out: NonNullable<CartCheckoutSettings['carrierRateTables']> = {
    ...(tables ?? {}),
  }
  for (const country of PACKETA_COUNTRIES) {
    for (const service of PACKETA_SERVICES) {
      if (!service.countries.includes(country.code)) continue
      const key = `${service.method}:${country.code}`
      if (!(key in out)) out[key] = []
    }
  }
  return out
}

export function buildPacketaCarrierSurchargesPatch(
  surcharges: CartCheckoutSettings['carrierSurcharges'] | undefined,
): NonNullable<CartCheckoutSettings['carrierSurcharges']> {
  return { ...(surcharges ?? {}) }
}

const DEFAULT_SURCHARGE: CarrierSurchargeConfig = {
  fuelPercent: 18.5,
  fuelMode: 'separate',
  tollPerStartedKgNet: 0.04,
  tollMode: 'separate',
  maxParcelWeightKg: 15,
}

function rateKey(method: string, country: string): string {
  return `${method}:${country}`
}

function resolveSurcharge(
  surcharges: CartCheckoutSettings['carrierSurcharges'] | undefined,
  method: string,
  country: string,
): CarrierSurchargeConfig {
  const table = surcharges ?? {}
  return (
    table[rateKey(method, country)] ??
    table[method] ??
    DEFAULT_CART_CHECKOUT_SETTINGS.carrierSurcharges?.[rateKey(method, country)] ??
    DEFAULT_CART_CHECKOUT_SETTINGS.carrierSurcharges?.[method] ??
    DEFAULT_SURCHARGE
  )
}

function formatNum(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(value)
}

function parseNum(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.')
  if (!cleaned || cleaned === '.' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function suggestNextTier(tiers: CarrierRateTier[]): CarrierRateTier {
  if (!tiers.length) return { maxWeightKg: 1, amount: 0 }
  const last = [...tiers].sort((a, b) => a.maxWeightKg - b.maxWeightKg).at(-1)!
  const nextWeight =
    last.maxWeightKg < 15
      ? Math.min(15, last.maxWeightKg === 1 ? 2 : last.maxWeightKg === 2 ? 5 : last.maxWeightKg + 5)
      : last.maxWeightKg + 5
  return { maxWeightKg: nextWeight, amount: last.amount }
}

/** Number input that keeps draft text while typing (empty / "1." / comma). */
function DecimalInput({
  id,
  value,
  min = 0,
  step = 0.01,
  disabled,
  className,
  suffix,
  onCommit,
}: {
  id?: string
  value: number
  min?: number
  step?: number | string
  disabled?: boolean
  className?: string
  suffix?: string
  onCommit: (next: number) => void
}) {
  const [draft, setDraft] = useState(formatNum(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(formatNum(value))
  }, [value, focused])

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={draft}
        className={cn('h-9 tabular-nums', suffix ? 'pr-10' : undefined)}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const raw = e.target.value
          if (raw !== '' && !/^-?\d*[.,]?\d*$/.test(raw)) return
          setDraft(raw)
          const parsed = parseNum(raw)
          if (parsed != null && parsed >= min) onCommit(parsed)
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = parseNum(draft)
          const next = parsed != null && parsed >= min ? parsed : min
          onCommit(next)
          setDraft(formatNum(next))
        }}
        step={step}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

type Props = {
  cart: CartCheckoutSettings
  onChange: (patch: Partial<CartCheckoutSettings>) => void
}

export function PacketaShippingSettingsSection({ cart, onChange }: Props) {
  const tables = cart.carrierRateTables ?? {}
  const surcharges = cart.carrierSurcharges ?? {}

  const setTiers = (method: string, country: string, tiers: CarrierRateTier[]) => {
    onChange({
      carrierRateTables: {
        ...tables,
        [rateKey(method, country)]: tiers,
      },
    })
  }

  const setSurcharge = (
    method: string,
    country: string,
    next: CarrierSurchargeConfig,
  ) => {
    onChange({
      carrierSurcharges: {
        ...surcharges,
        [rateKey(method, country)]: next,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Розрахунок доставки</CardTitle>
          <CardDescription>
            Вага за замовчуванням і ліміт посилки для Packeta / EU. Зберігається в{' '}
            <code className="text-xs">cart.checkout</code> — ті самі ключі, що читає pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="packeta-default-missing-weight">
              Вага позиції, якщо в товару немає ваги
            </Label>
            <DecimalInput
              id="packeta-default-missing-weight"
              value={cart.defaultMissingWeightKg ?? 1}
              min={0.01}
              step={0.01}
              suffix="kg"
              onCommit={(n) =>
                onChange({
                  defaultMissingWeightKg:
                    n > 0 ? n : DEFAULT_CART_CHECKOUT_SETTINGS.defaultMissingWeightKg,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Лише для розрахунку доставки. Не змінює збережену вагу варіанта в каталозі.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="packeta-max-parcel">Макс. вага стандартної посилки</Label>
            <DecimalInput
              id="packeta-max-parcel"
              value={cart.standardParcelMaxWeightKg ?? 15}
              min={0.1}
              step={1}
              suffix="kg"
              onCommit={(n) => onChange({ standardParcelMaxWeightKg: n > 0 ? n : 15 })}
            />
            <p className="text-xs text-muted-foreground">
              Важчі кошики діляться на кілька посилок (напр. 16 kg → 15 + 1). Тариф — NET за
              посилку.
            </p>
          </div>
        </CardContent>
      </Card>

      {PACKETA_COUNTRIES.map((country) => {
        const services = PACKETA_SERVICES.filter((s) => s.countries.includes(country.code))
        if (!services.length) return null
        return (
          <Card key={country.code}>
            <CardHeader>
              <CardTitle>
                {country.label}{' '}
                <span className="font-normal text-muted-foreground">({country.code})</span>
              </CardTitle>
              <CardDescription>
                Ключ таблиці <code className="text-xs">method:{country.code}</code>. Ціна тарифу —
                NET (без ПДВ, палива й мита).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.map((service) => {
                const key = rateKey(service.method, country.code)
                // Keep insertion/edit order stable while typing; sort only for display hint.
                const tiers = [...(tables[key] ?? [])]
                const surcharge = resolveSurcharge(surcharges, service.method, country.code)
                return (
                  <div
                    key={service.method}
                    className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{service.label}</p>
                        <p className="text-xs text-muted-foreground">{key}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() =>
                          setTiers(service.method, country.code, [
                            ...tiers,
                            suggestNextTier(tiers),
                          ])
                        }
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Додати ступінь ваги
                      </Button>
                    </div>

                    {tiers.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-50/60 px-3 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        Немає ступенів — доставка для цієї країни/сервісу недоступна, доки не
                        додасте тарифи.
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setTiers(service.method, country.code, [
                                { maxWeightKg: 1, amount: 0 },
                                { maxWeightKg: 5, amount: 0 },
                                { maxWeightKg: 10, amount: 0 },
                                { maxWeightKg: 15, amount: 0 },
                              ])
                            }
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Додати типові 1 / 5 / 10 / 15 kg
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">До ваги</TableHead>
                            <TableHead className="w-[40%]">Тариф NET</TableHead>
                            <TableHead className="w-[72px] text-right"> </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tiers.map((tier, index) => (
                            <TableRow key={`${key}-${index}`}>
                              <TableCell className="align-middle">
                                <DecimalInput
                                  value={tier.maxWeightKg}
                                  min={0.01}
                                  step={0.1}
                                  suffix="kg"
                                  onCommit={(n) => {
                                    const next = tiers.map((row, i) =>
                                      i === index ? { ...row, maxWeightKg: n } : row,
                                    )
                                    setTiers(service.method, country.code, next)
                                  }}
                                />
                              </TableCell>
                              <TableCell className="align-middle">
                                <DecimalInput
                                  value={tier.amount}
                                  min={0}
                                  step={0.01}
                                  suffix="€"
                                  onCommit={(n) => {
                                    const next = tiers.map((row, i) =>
                                      i === index ? { ...row, amount: n } : row,
                                    )
                                    setTiers(service.method, country.code, next)
                                  }}
                                />
                              </TableCell>
                              <TableCell className="align-middle text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                  aria-label="Видалити ступінь"
                                  onClick={() =>
                                    setTiers(
                                      service.method,
                                      country.code,
                                      tiers.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Паливна надбавка — NET %</Label>
                        <div className="flex gap-2">
                          <Select
                            value={surcharge.fuelMode}
                            onValueChange={(value) =>
                              setSurcharge(service.method, country.code, {
                                ...surcharge,
                                fuelMode: value as SurchargeMode,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-[140px] shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="separate">Окремо</SelectItem>
                              <SelectItem value="included">У тарифі</SelectItem>
                              <SelectItem value="none">Немає</SelectItem>
                            </SelectContent>
                          </Select>
                          <DecimalInput
                            className="min-w-0 flex-1"
                            value={surcharge.fuelPercent}
                            min={0}
                            step={0.1}
                            suffix="%"
                            disabled={surcharge.fuelMode !== 'separate'}
                            onCommit={(n) =>
                              setSurcharge(service.method, country.code, {
                                ...surcharge,
                                fuelPercent: n,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Мито — NET / розпочатий kg</Label>
                        <div className="flex gap-2">
                          <Select
                            value={surcharge.tollMode}
                            onValueChange={(value) =>
                              setSurcharge(service.method, country.code, {
                                ...surcharge,
                                tollMode: value as SurchargeMode,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-[140px] shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="separate">Окремо</SelectItem>
                              <SelectItem value="included">У тарифі</SelectItem>
                              <SelectItem value="none">Немає</SelectItem>
                            </SelectContent>
                          </Select>
                          <DecimalInput
                            className="min-w-0 flex-1"
                            value={surcharge.tollPerStartedKgNet}
                            min={0}
                            step={0.01}
                            suffix="€"
                            disabled={surcharge.tollMode !== 'separate'}
                            onCommit={(n) =>
                              setSurcharge(service.method, country.code, {
                                ...surcharge,
                                tollPerStartedKgNet: n,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Макс. посилка</Label>
                        <DecimalInput
                          value={surcharge.maxParcelWeightKg}
                          min={0}
                          step={1}
                          suffix="kg"
                          onCommit={(n) =>
                            setSurcharge(service.method, country.code, {
                              ...surcharge,
                              maxParcelWeightKg: n,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          0 = без спліту. Типово Packeta standard = 15 kg.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
