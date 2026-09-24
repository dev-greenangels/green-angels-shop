'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput, PriceBasisBadge } from '@/components/ui/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import type {
  CartCheckoutSettings,
  PacketaCodAmountTier,
  PacketaCodSettings,
  PacketaCustomerCodFeeBase,
  PacketaCustomerCodPriceMode,
} from '@/lib/settings/types'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'


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

const PACKETA_PHYSICAL_METHODS: Array<{
  method: 'packeta-box' | 'packeta-courier'
  label: string
}> = [
  { method: 'packeta-box', label: 'packeta-box (Z-Point / Z-Box)' },
  { method: 'packeta-courier', label: 'packeta-courier (Home HD)' },
]

const EMPTY_PACKETA_COD: PacketaCodSettings = {
  carrierCost: {
    enabled: false,
    basis: 'COD_AMOUNT',
    amountsAreNet: true,
    tiers: [],
  },
  cardOnCod: {
    enabled: false,
    percent: 0,
    basis: 'COD_AMOUNT_INCLUDING_VAT',
    chargedTo: 'SENDER',
    affectsCustomerTotal: false,
  },
  customerPrice: {
    mode: 'none',
    maxAmount: null,
    feeBase: 'products_subtotal',
    feeAmountsAreNet: true,
    fixedAmount: 0,
    tiers: [],
  },
}

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
  insurance: { enabled: false, maxDeclaredValue: null, tiers: [] },
  nonDepot: { amount: 0, automaticCalculation: false },
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
  const found =
    table[rateKey(method, country)] ??
    table[method] ??
    DEFAULT_CART_CHECKOUT_SETTINGS.carrierSurcharges?.[rateKey(method, country)] ??
    DEFAULT_CART_CHECKOUT_SETTINGS.carrierSurcharges?.[method] ??
    DEFAULT_SURCHARGE
  return {
    ...DEFAULT_SURCHARGE,
    ...found,
    insurance: {
      ...DEFAULT_SURCHARGE.insurance!,
      ...found.insurance,
      tiers: found.insurance?.tiers ?? [],
    },
    nonDepot: {
      amount: found.nonDepot?.amount ?? 0,
      automaticCalculation: false,
    },
  }
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

function resolvePacketaServiceLimits(
  cart: CartCheckoutSettings,
  method: 'packeta-box' | 'packeta-courier',
): { maxLongestSideCm: number; maxSideSumCm: number } {
  const fromConfig = cart.carrierConfigs?.packeta?.services?.[method]
  const fromCart = cart.cartSize?.limits?.find((row) => row.method === method)
  return {
    maxLongestSideCm:
      fromConfig?.maxLongestSideCm ?? fromCart?.maxLongestSideCm ?? 0,
    maxSideSumCm: fromConfig?.maxSideSumCm ?? fromCart?.maxSideSumCm ?? 0,
  }
}

function projectCartSizeLimit(
  cart: CartCheckoutSettings,
  method: CheckoutDeliveryMethodSlug,
  patch: { maxLongestSideCm?: number; maxSideSumCm?: number; maxGirthCm?: number },
): CartCheckoutSettings['cartSize'] {
  const limits = [...(cart.cartSize?.limits ?? [])]
  const idx = limits.findIndex((row) => row.method === method)
  const prev =
    idx >= 0
      ? limits[idx]
      : {
          method,
          maxLongestSideCm: 0,
          maxSideSumCm: 0,
          maxGirthCm: 0,
        }
  const nextRow = {
    ...prev,
    method,
    maxLongestSideCm: patch.maxLongestSideCm ?? prev.maxLongestSideCm,
    maxSideSumCm: patch.maxSideSumCm ?? prev.maxSideSumCm,
    maxGirthCm: patch.maxGirthCm ?? prev.maxGirthCm,
  }
  if (idx >= 0) limits[idx] = nextRow
  else limits.push(nextRow)
  return {
    enabled: cart.cartSize?.enabled ?? true,
    limits,
  }
}

type Props = {
  cart: CartCheckoutSettings
  onChange: (patch: Partial<CartCheckoutSettings>) => void
}


export function PacketaShippingSettingsSection({ cart, onChange }: Props) {
  const tCod = useTranslations('packetaCod')
  const tSur = useTranslations('packetaSurcharge')
  const tables = cart.carrierRateTables ?? {}
  const surcharges = cart.carrierSurcharges ?? {}
  const packetaConfig = cart.carrierConfigs?.packeta
  const tariffsAreNet =
    packetaConfig?.tariffAmountsAreNet ?? cart.carrierTariffAmountsAreNet !== false
  const cod: PacketaCodSettings = {
    carrierCost: {
      ...EMPTY_PACKETA_COD.carrierCost,
      ...packetaConfig?.cod?.carrierCost,
      tiers: packetaConfig?.cod?.carrierCost?.tiers ?? [],
    },
    cardOnCod: {
      ...EMPTY_PACKETA_COD.cardOnCod,
      ...packetaConfig?.cod?.cardOnCod,
      affectsCustomerTotal: false,
    },
    customerPrice: {
      ...EMPTY_PACKETA_COD.customerPrice,
      ...packetaConfig?.cod?.customerPrice,
      tiers: packetaConfig?.cod?.customerPrice?.tiers ?? [],
    },
    byService: packetaConfig?.cod?.byService,
  }

  const setTiers = (method: string, country: string, tiers: CarrierRateTier[]) => {
    onChange({
      carrierRateTables: {
        ...tables,
        // Customer shipping price keys only: method:CC (never method:CC:serviceKey).
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

  const setTariffAmountsAreNet = (value: boolean) => {
    // Packeta owns NET/GROSS under carrierConfigs.packeta — do not write legacy root flag.
    onChange({
      carrierConfigs: {
        ...cart.carrierConfigs,
        packeta: {
          ...packetaConfig,
          tariffAmountsAreNet: value,
        },
      },
    })
  }

  const setPacketaServiceLimit = (
    method: 'packeta-box' | 'packeta-courier',
    field: 'maxLongestSideCm' | 'maxSideSumCm',
    value: number,
  ) => {
    const prevSvc = packetaConfig?.services?.[method] ?? {}
    const nextSvc = { ...prevSvc, [field]: value }
    onChange({
      carrierConfigs: {
        ...cart.carrierConfigs,
        packeta: {
          ...packetaConfig,
          services: {
            ...packetaConfig?.services,
            [method]: nextSvc,
          },
        },
      },
      cartSize: projectCartSizeLimit(cart, method, { [field]: value }),
    })
  }

  const setCod = (next: PacketaCodSettings) => {
    onChange({
      carrierConfigs: {
        ...cart.carrierConfigs,
        packeta: {
          ...packetaConfig,
          cod: next,
        },
      },
    })
  }

  const setCarrierCost = (partial: Partial<PacketaCodSettings['carrierCost']>) => {
    setCod({ ...cod, carrierCost: { ...cod.carrierCost, ...partial } })
  }

  const setCustomerPrice = (partial: Partial<PacketaCodSettings['customerPrice']>) => {
    setCod({ ...cod, customerPrice: { ...cod.customerPrice, ...partial } })
  }

  const setCardOnCod = (partial: Partial<PacketaCodSettings['cardOnCod']>) => {
    setCod({
      ...cod,
      cardOnCod: { ...cod.cardOnCod, ...partial, affectsCustomerTotal: false },
    })
  }

  const renderTierTable = (
    tiers: PacketaCodAmountTier[],
    onUpdate: (next: PacketaCodAmountTier[]) => void,
    areNet: boolean,
    feeLabel: string,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{feeLabel}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onUpdate([...tiers, { fromAmount: 0, toAmount: null, fee: 0 }])
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {tCod('addTier')}
        </Button>
      </div>
      {tiers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{tCod('tiersEmpty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCod('fromAmount')}</TableHead>
              <TableHead>{tCod('toAmount')}</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1.5">
                  {tCod('fee')} <PriceBasisBadge areNet={areNet} />
                </span>
              </TableHead>
              <TableHead className="w-[72px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, index) => (
              <TableRow key={`cod-tier-${index}`}>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.fromAmount}
                    onChange={(e) => {
                      const next = [...tiers]
                      next[index] = {
                        ...tier,
                        fromAmount: Math.max(0, Number(e.target.value) || 0),
                      }
                      onUpdate(next)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.toAmount ?? ''}
                    placeholder="∞"
                    onChange={(e) => {
                      const raw = e.target.value.trim()
                      const next = [...tiers]
                      next[index] = {
                        ...tier,
                        toAmount: raw ? Math.max(0, Number(raw) || 0) : null,
                      }
                      onUpdate(next)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.fee}
                    onChange={(e) => {
                      const next = [...tiers]
                      next[index] = {
                        ...tier,
                        fee: Math.max(0, Number(e.target.value) || 0),
                      }
                      onUpdate(next)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => onUpdate(tiers.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Parcel / physical limits</CardTitle>
          <CardDescription>
            Maximum shipment size per Packeta parcel (carrier transport). Not packaging BOX/PALLET
            (those stay under Cart → Packaging). Not pickup-point search filters (Connection card
            above). Per-service maxParcelWeightKg is under each service row below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Packeta tariffs are entered as</Label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="carrier-tariff-price-basis"
                  checked={tariffsAreNet}
                  onChange={() => setTariffAmountsAreNet(true)}
                />
                NET — без ПДВ
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="carrier-tariff-price-basis"
                  checked={!tariffsAreNet}
                  onChange={() => setTariffAmountsAreNet(false)}
                />
                GROSS — з ПДВ
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Stored in <code className="text-xs">carrierConfigs.packeta.tariffAmountsAreNet</code>.
              Root <code className="text-xs">carrierTariffAmountsAreNet</code> is legacy fallback
              only (not edited here). Contract price list is typically NET. Changing mode does not
              convert stored amounts.
            </p>
          </div>

          <div className="space-y-3 sm:col-span-2">
            <Label>Maximum shipment dimensions per Packeta parcel (cm)</Label>
            <p className="text-xs text-muted-foreground">
              Written to carrierConfigs.packeta.services[method] and projected into
              cart.cartSize.limits (compatibility). 0 = do not check that field.
            </p>
            {PACKETA_PHYSICAL_METHODS.map((svc) => {
              const limits = resolvePacketaServiceLimits(cart, svc.method)
              return (
                <div
                  key={svc.method}
                  className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-3"
                >
                  <p className="text-sm font-medium sm:col-span-3">{svc.label}</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Макс. найдовша сторона</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={limits.maxLongestSideCm}
                      onChange={(e) =>
                        setPacketaServiceLimit(
                          svc.method,
                          'maxLongestSideCm',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Макс. сума сторін (L+W+H)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={limits.maxSideSumCm}
                      onChange={(e) =>
                        setPacketaServiceLimit(
                          svc.method,
                          'maxSideSumCm',
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tCod('title')}</CardTitle>
          <CardDescription>{tCod('summary')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
            {tCod('distinctionHelp')}
          </p>

          {/* A — Packeta costs */}
          <div className="space-y-4 rounded-lg border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">{tCod('packetaCostsTitle')}</p>
              <p className="text-xs text-muted-foreground">{tCod('packetaCostsHelp')}</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>{tCod('carrierCostEnable')}</Label>
                <p className="text-xs text-muted-foreground">{tCod('carrierCostBasisHelp')}</p>
              </div>
              <Switch
                checked={cod.carrierCost.enabled}
                onCheckedChange={(enabled) => setCarrierCost({ enabled })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>{tCod('carrierCostNet')}</Label>
              </div>
              <Switch
                checked={cod.carrierCost.amountsAreNet}
                onCheckedChange={(amountsAreNet) => setCarrierCost({ amountsAreNet })}
              />
            </div>

            {renderTierTable(
              cod.carrierCost.tiers,
              (tiers) => setCarrierCost({ tiers }),
              cod.carrierCost.amountsAreNet,
              tCod('carrierCostTiers'),
            )}

            <div className="space-y-3 border-t border-border/60 pt-4">
              <p className="text-sm font-medium">{tCod('cardOnCodTitle')}</p>
              <p className="text-xs text-muted-foreground">{tCod('cardOnCodHelp')}</p>
              <div className="flex items-center justify-between gap-4">
                <Label>{tCod('cardOnCodEnable')}</Label>
                <Switch
                  checked={cod.cardOnCod.enabled}
                  onCheckedChange={(enabled) => setCardOnCod({ enabled })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tCod('cardOnCodPercent')}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cod.cardOnCod.percent || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value.trim()
                    setCardOnCod({ percent: raw ? Math.max(0, Number(raw) || 0) : 0 })
                  }}
                />
                <p className="text-xs text-muted-foreground">{tCod('cardOnCodInformational')}</p>
              </div>
            </div>
          </div>

          {/* B — Customer price */}
          <div className="space-y-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-medium">{tCod('customerPriceTitle')}</p>
              <p className="text-xs text-muted-foreground">{tCod('customerPriceHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label>{tCod('customerPriceMode')}</Label>
              <Select
                value={cod.customerPrice.mode}
                onValueChange={(value) =>
                  setCustomerPrice({ mode: value as PacketaCustomerCodPriceMode })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCod('modeNone')}</SelectItem>
                  <SelectItem value="fixed">{tCod('modeFixed')}</SelectItem>
                  <SelectItem value="tiers">{tCod('modeTiers')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cod.customerPrice.mode !== 'none' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{tCod('maxCodAmount')}</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cod.customerPrice.maxAmount ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        setCustomerPrice({
                          maxAmount: raw ? Number(raw) || 0 : null,
                        })
                      }}
                      placeholder={tCod('maxCodUnlimited')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tCod('feeBaseLabel')}</Label>
                    <Select
                      value={cod.customerPrice.feeBase}
                      onValueChange={(value) =>
                        setCustomerPrice({
                          feeBase: value as PacketaCustomerCodFeeBase,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cod_collected">
                          {tCod('feeBase.cod_collected')}
                        </SelectItem>
                        <SelectItem value="products_subtotal">
                          {tCod('feeBase.products_subtotal')}
                        </SelectItem>
                        <SelectItem value="grand_total_before_cod">
                          {tCod('feeBase.grand_total_before_cod')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{tCod('feeBaseHelp')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tCod('customerFeeBasis')}</Label>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="packeta-customer-cod-basis"
                        checked={cod.customerPrice.feeAmountsAreNet}
                        onChange={() => setCustomerPrice({ feeAmountsAreNet: true })}
                      />
                      {tCod('net')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="packeta-customer-cod-basis"
                        checked={!cod.customerPrice.feeAmountsAreNet}
                        onChange={() => setCustomerPrice({ feeAmountsAreNet: false })}
                      />
                      {tCod('gross')}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cod.customerPrice.feeAmountsAreNet
                      ? tCod('netHelp')
                      : tCod('grossHelp')}
                  </p>
                </div>

                {cod.customerPrice.mode === 'fixed' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>{tCod('fixedAmount')}</Label>
                      <PriceBasisBadge areNet={cod.customerPrice.feeAmountsAreNet} />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cod.customerPrice.fixedAmount}
                      onChange={(e) =>
                        setCustomerPrice({
                          fixedAmount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                ) : null}

                {cod.customerPrice.mode === 'tiers'
                  ? renderTierTable(
                      cod.customerPrice.tiers,
                      (tiers) => setCustomerPrice({ tiers }),
                      cod.customerPrice.feeAmountsAreNet,
                      tCod('customerTiers'),
                    )
                  : null}

                {cod.customerPrice.mode === 'tiers' &&
                cod.carrierCost.enabled &&
                cod.carrierCost.tiers.length > 0 ? (
                  <p className="text-xs text-muted-foreground">{tCod('coverageHint')}</p>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{tCod('modeNoneHelp')}</p>
            )}
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
                Customer delivery prices — {country.label}{' '}
                <span className="font-normal text-muted-foreground">({country.code})</span>
              </CardTitle>
              <CardDescription>
                Customer delivery prices for Packeta pickup/box and courier to {country.code}
                (key <code className="text-xs">method:{country.code}</code>). Last-mile carrier
                choice is not required. Basis {tariffsAreNet ? 'NET (ex-VAT)' : 'GROSS (inc-VAT)'}.
                Fuel / toll / insurance rows below still adjust the customer delivery total today —
                true Packeta contract-cost separation needs manager confirmation of production
                amounts (values are preserved, not migrated).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.map((service) => {
                const key = rateKey(service.method, country.code)
                const tiers = [...(tables[key] ?? [])]
                const surcharge = resolveSurcharge(
                  surcharges,
                  service.method,
                  country.code,
                )
                const writeTiers = (next: CarrierRateTier[]) =>
                  setTiers(service.method, country.code, next)
                const writeSurcharge = (next: CarrierSurchargeConfig) =>
                  setSurcharge(service.method, country.code, next)
                return (
                  <div
                    key={service.method}
                    className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{service.label}</p>
                        <p className="text-xs text-muted-foreground">{key}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() =>
                          writeTiers([...tiers, suggestNextTier(tiers)])
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
                              writeTiers([
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
                            <TableHead className="w-[40%]">
                              <span className="inline-flex items-center gap-1.5">
                                Тариф <PriceBasisBadge areNet={tariffsAreNet} />
                              </span>
                            </TableHead>
                            <TableHead className="w-[72px] text-right"> </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tiers.map((tier, index) => (
                            <TableRow key={`${key}-${index}`}>
                              <TableCell className="align-middle">
                                <NumberInput
                                  value={tier.maxWeightKg}
                                  min={0.01}
                                  step={0.1}
                                  suffix="kg"
                                  onCommit={(n) => {
                                    const next = tiers.map((row, i) =>
                                      i === index ? { ...row, maxWeightKg: n } : row,
                                    )
                                    writeTiers(next)
                                  }}
                                />
                              </TableCell>
                              <TableCell className="align-middle">
                                <NumberInput
                                  value={tier.amount}
                                  min={0}
                                  step={0.01}
                                  suffix="€"
                                  onCommit={(n) => {
                                    const next = tiers.map((row, i) =>
                                      i === index ? { ...row, amount: n } : row,
                                    )
                                    writeTiers(next)
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
                                    writeTiers(tiers.filter((_, i) => i !== index))
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
                      <div className="col-span-full space-y-1">
                        <p className="text-sm font-medium">
                          Fuel / toll / insurance / non-depot
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Packeta contract-style adjustments. Today these still change the customer
                          delivery total for this method:country. Do not treat as a separate internal
                          ledger until production amounts are confirmed.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Паливна надбавка (%)</Label>
                        <div className="flex gap-2">
                          <Select
                            value={surcharge.fuelMode}
                            onValueChange={(value) =>
                              writeSurcharge({
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
                          <NumberInput
                            className="min-w-0 flex-1"
                            value={surcharge.fuelPercent}
                            min={0}
                            step={0.1}
                            suffix="%"
                            disabled={surcharge.fuelMode !== 'separate'}
                            onCommit={(n) =>
                              writeSurcharge({
                                ...surcharge,
                                fuelPercent: n,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Відсоток не є NET/GROSS — застосовується до бази тарифу.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Мито / розпочатий kg</Label>
                          <PriceBasisBadge areNet={tariffsAreNet} />
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={surcharge.tollMode}
                            onValueChange={(value) =>
                              writeSurcharge({
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
                          <NumberInput
                            className="min-w-0 flex-1"
                            value={surcharge.tollPerStartedKgNet}
                            min={0}
                            step={0.01}
                            suffix="€"
                            disabled={surcharge.tollMode !== 'separate'}
                            onCommit={(n) =>
                              writeSurcharge({
                                ...surcharge,
                                tollPerStartedKgNet: n,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum shipment weight per Packeta parcel (kg)</Label>
                        <NumberInput
                          value={surcharge.maxParcelWeightKg}
                          min={0}
                          step={1}
                          suffix="kg"
                          onCommit={(n) =>
                            writeSurcharge({
                              ...surcharge,
                              maxParcelWeightKg: n,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Carrier parcel limit (not packaging boxMaxWeightKg). 0 = no rate split
                          (one parcel for the whole cart). Typical Packeta = 15 kg.
                          {service.method === 'packeta-box'
                            ? ' Also hides packeta-box at checkout when cart weight exceeds this (one packet per pickup point).'
                            : null}
                        </p>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="space-y-3 border-t border-border/60 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{tSur('insuranceTitle')}</p>
                          <p className="text-xs text-muted-foreground">{tSur('insuranceHelp')}</p>
                        </div>
                        <Switch
                          checked={surcharge.insurance?.enabled === true}
                          onCheckedChange={(enabled) =>
                            writeSurcharge({
                              ...surcharge,
                              insurance: {
                                enabled,
                                maxDeclaredValue: surcharge.insurance?.maxDeclaredValue ?? null,
                                tiers: surcharge.insurance?.tiers ?? [],
                              },
                            })
                          }
                        />
                      </div>
                      {surcharge.insurance?.enabled ? (
                        <>
                          <div className="space-y-2">
                            <Label>{tSur('maxDeclaredValue')}</Label>
                            <NumberInput
                              value={surcharge.insurance.maxDeclaredValue ?? 0}
                              min={0}
                              step={1}
                              suffix="€"
                              onCommit={(n) =>
                                writeSurcharge({
                                  ...surcharge,
                                  insurance: {
                                    enabled: true,
                                    maxDeclaredValue: n > 0 ? n : null,
                                    tiers: surcharge.insurance?.tiers ?? [],
                                  },
                                })
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {tSur('maxDeclaredValueHelp')}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <Label>{tSur('insuranceTiers')}</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  writeSurcharge({
                                    ...surcharge,
                                    insurance: {
                                      enabled: true,
                                      maxDeclaredValue:
                                        surcharge.insurance?.maxDeclaredValue ?? null,
                                      tiers: [
                                        ...(surcharge.insurance?.tiers ?? []),
                                        { upTo: 0, fee: 0 },
                                      ],
                                    },
                                  })
                                }
                              >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                {tSur('addTier')}
                              </Button>
                            </div>
                            {(surcharge.insurance.tiers?.length ?? 0) === 0 ? (
                              <p className="text-xs text-muted-foreground">{tSur('tiersEmpty')}</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{tSur('upTo')}</TableHead>
                                    <TableHead>
                                      <span className="inline-flex items-center gap-1.5">
                                        {tSur('fee')}{' '}
                                        <PriceBasisBadge areNet={tariffsAreNet} />
                                      </span>
                                    </TableHead>
                                    <TableHead className="w-[72px]" />
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(surcharge.insurance.tiers ?? []).map((tier, index) => (
                                    <TableRow key={`ins-${index}`}>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          value={tier.upTo}
                                          onChange={(e) => {
                                            const tiers = [
                                              ...(surcharge.insurance?.tiers ?? []),
                                            ]
                                            tiers[index] = {
                                              ...tier,
                                              upTo: Math.max(0, Number(e.target.value) || 0),
                                            }
                                            writeSurcharge({
                                              ...surcharge,
                                              insurance: {
                                                enabled: true,
                                                maxDeclaredValue:
                                                  surcharge.insurance?.maxDeclaredValue ?? null,
                                                tiers,
                                              },
                                            })
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          value={tier.fee}
                                          onChange={(e) => {
                                            const tiers = [
                                              ...(surcharge.insurance?.tiers ?? []),
                                            ]
                                            tiers[index] = {
                                              ...tier,
                                              fee: Math.max(0, Number(e.target.value) || 0),
                                            }
                                            writeSurcharge({
                                              ...surcharge,
                                              insurance: {
                                                enabled: true,
                                                maxDeclaredValue:
                                                  surcharge.insurance?.maxDeclaredValue ?? null,
                                                tiers,
                                              },
                                            })
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                          onClick={() => {
                                            const tiers = (
                                              surcharge.insurance?.tiers ?? []
                                            ).filter((_, i) => i !== index)
                                            writeSurcharge({
                                              ...surcharge,
                                              insurance: {
                                                enabled: true,
                                                maxDeclaredValue:
                                                  surcharge.insurance?.maxDeclaredValue ?? null,
                                                tiers,
                                              },
                                            })
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Non-depot */}
                    <div className="space-y-3 border-t border-border/60 pt-4">
                      <p className="text-sm font-medium">{tSur('nonDepotTitle')}</p>
                      <p className="text-xs text-muted-foreground">{tSur('nonDepotHelp')}</p>
                      <div className="space-y-2">
                        <Label>{tSur('nonDepotAmount')}</Label>
                        <NumberInput
                          value={surcharge.nonDepot?.amount ?? 0}
                          min={0}
                          step={0.01}
                          suffix="€"
                          onCommit={(n) =>
                            writeSurcharge({
                              ...surcharge,
                              nonDepot: { amount: n, automaticCalculation: false },
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Country/method COD support (customer-facing; not Packeta carrier id) */}
                    <div className="space-y-3 border-t border-border/60 pt-4">
                      <p className="text-sm font-medium">{tSur('serviceCodTitle')}</p>
                      <p className="text-xs text-muted-foreground">
                        Customer COD eligibility for this delivery method and country (not a Packeta
                        last-mile carrier id). Internal Packeta COD cost (A) may still use
                        service-specific keys in Settings JSON when present.
                      </p>
                      {(() => {
                        const svcKey = rateKey(service.method, country.code)
                        const svcCod = cod.byService?.[svcKey] ?? {
                          supportsCod: true,
                          maxAmount: null,
                          carrierCost: {
                            enabled: false,
                            basis: 'COD_AMOUNT' as const,
                            amountsAreNet: true,
                            tiers: [],
                          },
                        }
                        const setSvcCod = (
                          next: NonNullable<PacketaCodSettings['byService']>[string],
                        ) => {
                          setCod({
                            ...cod,
                            byService: {
                              ...cod.byService,
                              [svcKey]: next,
                            },
                          })
                        }
                        return (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <Label>{tSur('supportsCod')}</Label>
                              <Switch
                                checked={svcCod.supportsCod}
                                onCheckedChange={(supportsCod) =>
                                  setSvcCod({ ...svcCod, supportsCod })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{tSur('maxCodAmount')}</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={svcCod.maxAmount ?? ''}
                                placeholder={tSur('maxCodUnlimited')}
                                onChange={(e) => {
                                  const raw = e.target.value.trim()
                                  setSvcCod({
                                    ...svcCod,
                                    maxAmount: raw ? Number(raw) || 0 : null,
                                  })
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <Label>{tSur('carrierCodCostEnable')}</Label>
                              <Switch
                                checked={svcCod.carrierCost.enabled}
                                onCheckedChange={(enabled) =>
                                  setSvcCod({
                                    ...svcCod,
                                    carrierCost: { ...svcCod.carrierCost, enabled },
                                  })
                                }
                              />
                            </div>
                            {svcCod.carrierCost.enabled
                              ? renderTierTable(
                                  svcCod.carrierCost.tiers,
                                  (tiers) =>
                                    setSvcCod({
                                      ...svcCod,
                                      carrierCost: { ...svcCod.carrierCost, tiers },
                                    }),
                                  svcCod.carrierCost.amountsAreNet,
                                  tSur('carrierCodCostTiers'),
                                )
                              : null}
                          </>
                        )
                      })()}
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
