'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Save, XCircle } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { CompanyBankDetailsFields } from '@/components/backstage/company-bank-details-fields'
import {
  fetchPaymentProvidersStatus,
  type PaymentProvidersStatus,
} from '@/lib/backstage/payments'
import { DEFAULT_CHECKOUT_BANK_DETAILS } from '@/lib/settings/defaults'
import type { CartCheckoutSettings, OnlineCardProvider } from '@/lib/settings/types'
import {
  CHECKOUT_DELIVERY_METHODS,
  CHECKOUT_PAYMENT_METHODS,
  DELIVERY_METHOD_BACKSTAGE_LABELS,
  PAYMENT_METHOD_BACKSTAGE_LABELS,
  type CheckoutDeliveryMethodSlug,
  type CheckoutPaymentMethodSlug,
} from '@/lib/checkout/methods'

const DEFAULT_CART_SIZE_LIMITS: CartCheckoutSettings['cartSize']['limits'] = [
  { method: 'packeta-box', maxLongestSideCm: 120, maxSideSumCm: 150, maxGirthCm: 0 },
  { method: 'packeta-courier', maxLongestSideCm: 120, maxSideSumCm: 150, maxGirthCm: 0 },
  { method: 'gls-courier', maxLongestSideCm: 200, maxSideSumCm: 0, maxGirthCm: 300 },
]

const ONLINE_CARD_PROVIDER_LABELS: Record<OnlineCardProvider, string> = {
  monopay: 'MonoPay (Plata by Mono)',
  stripe: 'Stripe',
}

type CartCheckoutSettingsFormProps = {
  cart: CartCheckoutSettings
  marketRegion?: 'ua' | 'sk'
  /** Derived display for taxIncluded (from market.priceBasis). */
  marketPriceBasis?: 'ex_vat' | 'inc_vat'
  onChange: (cart: CartCheckoutSettings) => void
  onSave: () => void
  saving: boolean
  isDirty?: boolean
}

export function CartCheckoutSettingsForm({
  cart,
  marketRegion = 'ua',
  marketPriceBasis = 'inc_vat',
  onChange,
  onSave,
  saving,
  isDirty = false,
}: CartCheckoutSettingsFormProps) {
  const [providersStatus, setProvidersStatus] = useState<PaymentProvidersStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchPaymentProvidersStatus()
      .then((status) => {
        if (!cancelled) setProvidersStatus(status)
      })
      .catch(() => {
        if (!cancelled) setProvidersStatus(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patch = (partial: Partial<CartCheckoutSettings>) => onChange({ ...cart, ...partial })

  const toggleDeliveryMethod = (method: CheckoutDeliveryMethodSlug, enabled: boolean) => {
    const current = cart.enabledDeliveryMethods ?? []
    const next = enabled
      ? [...new Set([...current, method])]
      : current.filter((item) => item !== method)
    if (!next.length) return
    patch({ enabledDeliveryMethods: next })
  }

  const togglePaymentMethod = (method: CheckoutPaymentMethodSlug, enabled: boolean) => {
    const current = cart.enabledPaymentMethods ?? []
    const next = enabled
      ? [...new Set([...current, method])]
      : current.filter((item) => item !== method)
    if (!next.length) return
    patch({ enabledPaymentMethods: next })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Відображення в кошику та checkout</CardTitle>
          <CardDescription>
            Оберіть, які додаткові рядки показувати у підсумку замовлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-delivery">Доставка</Label>
            <Switch
              id="show-delivery"
              checked={cart.showDelivery}
              onCheckedChange={(showDelivery) => patch({ showDelivery })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-packaging">Пакування</Label>
            <Switch
              id="show-packaging"
              checked={cart.showPackaging}
              onCheckedChange={(showPackaging) => patch({ showPackaging })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-tax">Податок (ПДВ)</Label>
            <Switch
              id="show-tax"
              checked={cart.showTax}
              onCheckedChange={(showTax) => patch({ showTax })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show-promo-code">Додати промокод</Label>
            <Switch
              id="show-promo-code"
              checked={cart.showPromoCode !== false}
              onCheckedChange={(showPromoCode) => patch({ showPromoCode })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="allow-shipment-split">Розділення замовлення за датою</Label>
              <p className="text-xs text-muted-foreground">
                Якщо в кошику є товари «зараз» і з датою availableFrom — запропонувати split
              </p>
            </div>
            <Switch
              id="allow-shipment-split"
              checked={cart.allowShipmentSplit !== false}
              onCheckedChange={(allowShipmentSplit) => patch({ allowShipmentSplit })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Суми</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Режим доставки</Label>
            <Select
              value={cart.deliveryMode ?? 'carrier_rates'}
              onValueChange={(value) =>
                patch({ deliveryMode: value as CartCheckoutSettings['deliveryMode'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Безкоштовно</SelectItem>
                <SelectItem value="carrier_rates">Тарифні таблиці (Packeta / GLS)</SelectItem>
                <SelectItem value="fixed">Фіксована сума</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {cart.deliveryMode === 'carrier_rates'
                ? 'Сума рахується з тарифної таблиці за вагою кошика і способом доставки, одразу додається до «Разом». Якщо для методу немає рядка — fallback на фіксовану суму нижче (або 0).'
                : cart.deliveryMode === 'fixed'
                  ? 'Однакова сума доставки для всіх способів (крім самовивозу, якщо увімкнено безкоштовно).'
                  : 'Доставка завжди 0.'}
            </p>
          </div>
          {cart.deliveryMode === 'fixed' || cart.deliveryMode === 'carrier_rates' ? (
            <div className="space-y-2">
              <Label>
                {cart.deliveryMode === 'carrier_rates'
                  ? 'Fallback сума доставки (якщо немає тарифу)'
                  : 'Сума доставки'}
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cart.deliveryAmount}
                onChange={(e) => patch({ deliveryAmount: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
          {cart.deliveryMode === 'carrier_rates' ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Тарифні таблиці за вагою (JSON)</Label>
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={JSON.stringify(cart.carrierRateTables ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as CartCheckoutSettings['carrierRateTables']
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                      patch({ carrierRateTables: parsed })
                    }
                  } catch {
                    /* ignore incomplete JSON while typing */
                  }
                }}
                placeholder='{"packeta-box":[{"maxWeightKg":5,"amount":3.49}]}'
              />
              <p className="text-xs text-muted-foreground">
                Ключі — slug способу доставки (`packeta-box`, `packeta-courier`, `gls-courier`). Для кожної
                ваги кошика береться перший tier з `maxWeightKg` ≥ ваги. Сума в валюті деплою (EUR / UAH).
              </p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Режим пакування</Label>
            <Select
              value={cart.packagingMode ?? 'flat'}
              onValueChange={(value) =>
                patch({ packagingMode: value as CartCheckoutSettings['packagingMode'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Фіксована сума</SelectItem>
                <SelectItem value="boxes">Коробки / палети (вага й об’єм)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(cart.packagingMode ?? 'flat') === 'flat' ? (
            <div className="space-y-2">
              <Label>Пакування (валюта деплою)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cart.packagingAmount}
                onChange={(e) => patch({ packagingAmount: Number(e.target.value) || 0 })}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Макс. кг на коробку (0 = ігнорувати)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={cart.boxMaxWeightKg ?? 0}
                  onChange={(e) => patch({ boxMaxWeightKg: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Макс. літрів на коробку (0 = ігнорувати)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={cart.boxMaxVolumeL ?? 0}
                  onChange={(e) => patch({ boxMaxVolumeL: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ціна однієї коробки (з ПДВ, валюта деплою)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cart.boxUnitPrice ?? 0}
                  onChange={(e) => patch({ boxUnitPrice: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Коробок на палету (0 = без палет)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={cart.boxesPerPallet ?? 0}
                  onChange={(e) =>
                    patch({ boxesPerPallet: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Доплата за повну палету</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cart.palletSurcharge ?? 0}
                  onChange={(e) => patch({ palletSurcharge: Number(e.target.value) || 0 })}
                />
              </div>
            </>
          )}
          {marketRegion === 'ua' ? (
            <div className="space-y-2">
              <Label>Ставка ПДВ (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={cart.taxRatePercent}
                onChange={(e) => patch({ taxRatePercent: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Для UA — єдина ставка чекауту. Для SK ставки живуть у Market → «Куди доставляємо» /
                TEDB.
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 sm:col-span-1">
              <p className="text-sm font-medium">Ставка DPH</p>
              <p className="text-xs text-muted-foreground">
                Не редагується тут. Чекаут бере ставку з Market (довідник країн / OSS / CN) або
                TEDB. Поле cart.taxRatePercent лишається лише як крайній fallback на сервері.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 sm:col-span-2">
            <div>
              <Label>ПДВ уже в цінах товарів</Label>
              <p className="text-xs text-muted-foreground">
                Лише відображення з Market → «Базис цін». Змініть базис там — після збереження
                Market синхронізується сюди на сервері.
              </p>
            </div>
            <Switch
              checked={marketPriceBasis === 'inc_vat'}
              disabled
              aria-readonly
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:col-span-2">
            <div>
              <Label>ПДВ/DPH також на доставку та пакування</Label>
              <p className="text-xs text-muted-foreground">
                {marketRegion === 'sk'
                  ? 'Для SK завжди увімкнено на сервері — перемикач лише показує стан.'
                  : 'Для UA можна увімкнути вручну.'}
              </p>
            </div>
            <Switch
              checked={marketRegion === 'sk' ? true : Boolean(cart.taxAppliesToFees)}
              disabled={marketRegion === 'sk'}
              onCheckedChange={(taxAppliesToFees) => patch({ taxAppliesToFees })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:col-span-2">
            <div>
              <Label>Безкоштовна доставка при самовивозі</Label>
            </div>
            <Switch
              checked={cart.deliveryFreeForPickup}
              onCheckedChange={(deliveryFreeForPickup) => patch({ deliveryFreeForPickup })}
            />
          </div>
          <div className="space-y-2">
            <Label>Комісія dobierka (післяплата)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={cart.codFeeAmount ?? 0}
              onChange={(e) => patch({ codFeeAmount: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Режим комісії dobierka</Label>
            <Select
              value={cart.codFeeMode ?? 'fixed'}
              onValueChange={(value) =>
                patch({ codFeeMode: value as CartCheckoutSettings['codFeeMode'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Фіксована сума</SelectItem>
                <SelectItem value="percent">Відсоток від товарів</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Вага кошика для доставки</Label>
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="cart-weight-enabled">Увімкнути розрахунок ваги</Label>
                <Switch
                  id="cart-weight-enabled"
                  checked={cart.cartWeight?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    patch({
                      cartWeight: {
                        ...(cart.cartWeight ?? {
                          enabled: false,
                          useFactKg: true,
                          useVolumetricKg: false,
                          volumetricDivisor: 5000,
                        }),
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="cart-weight-fact">Фактична вага (кг / tare)</Label>
                <Switch
                  id="cart-weight-fact"
                  checked={cart.cartWeight?.useFactKg ?? true}
                  disabled={!cart.cartWeight?.enabled}
                  onCheckedChange={(checked) =>
                    patch({
                      cartWeight: {
                        ...(cart.cartWeight ?? {
                          enabled: false,
                          useFactKg: true,
                          useVolumetricKg: false,
                          volumetricDivisor: 5000,
                        }),
                        useFactKg: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="cart-weight-vol">Об&apos;ємна вага (габарити)</Label>
                <Switch
                  id="cart-weight-vol"
                  checked={cart.cartWeight?.useVolumetricKg ?? false}
                  disabled={!cart.cartWeight?.enabled}
                  onCheckedChange={(checked) =>
                    patch({
                      cartWeight: {
                        ...(cart.cartWeight ?? {
                          enabled: false,
                          useFactKg: true,
                          useVolumetricKg: false,
                          volumetricDivisor: 5000,
                        }),
                        useVolumetricKg: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cart-weight-divisor">Дільник об&apos;ємної ваги (см³→кг)</Label>
                <Input
                  id="cart-weight-divisor"
                  type="number"
                  min={1}
                  step={1}
                  disabled={!cart.cartWeight?.enabled || !cart.cartWeight?.useVolumetricKg}
                  value={cart.cartWeight?.volumetricDivisor ?? 5000}
                  onChange={(e) =>
                    patch({
                      cartWeight: {
                        ...(cart.cartWeight ?? {
                          enabled: false,
                          useFactKg: true,
                          useVolumetricKg: false,
                          volumetricDivisor: 5000,
                        }),
                        volumetricDivisor: Number(e.target.value) || 5000,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Якщо увімкнені обидва режими — береться max(факт, об&apos;ємна) × кількість. Типово 5000.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Макс. габарити доставки (см)</Label>
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="cart-size-enabled">
                  Увімкнути фільтр за макс. довжиною / сумою сторін / girth
                </Label>
                <Switch
                  id="cart-size-enabled"
                  checked={cart.cartSize?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    patch({
                      cartSize: {
                        enabled: checked,
                        limits: (cart.cartSize?.limits?.length
                          ? cart.cartSize.limits
                          : DEFAULT_CART_SIZE_LIMITS
                        ).map((row) => ({ ...row })),
                      },
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Packeta nadrozměrná: найдовша ≤120, сума сторін ≤150. GLS SK: довжина ≤200, girth
                (L+2W+2H) ≤300. 0 = не перевіряти поле. Без L/W/H у варіантах методи не ріжуться.
              </p>
              {(cart.cartSize?.limits ?? []).map((row, index) => (
                <div
                  key={`${row.method}-${index}`}
                  className="grid gap-2 rounded-md border border-dashed p-2 sm:grid-cols-4"
                >
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs text-muted-foreground">{row.method}</Label>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Макс. довжина</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={!cart.cartSize?.enabled}
                      value={row.maxLongestSideCm}
                      onChange={(e) => {
                        const next = [...(cart.cartSize?.limits ?? [])]
                        next[index] = {
                          ...row,
                          maxLongestSideCm: Math.max(0, Number(e.target.value) || 0),
                        }
                        patch({
                          cartSize: {
                            enabled: cart.cartSize?.enabled ?? false,
                            limits: next,
                          },
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Макс. сума сторін</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={!cart.cartSize?.enabled}
                      value={row.maxSideSumCm}
                      onChange={(e) => {
                        const next = [...(cart.cartSize?.limits ?? [])]
                        next[index] = {
                          ...row,
                          maxSideSumCm: Math.max(0, Number(e.target.value) || 0),
                        }
                        patch({
                          cartSize: {
                            enabled: cart.cartSize?.enabled ?? false,
                            limits: next,
                          },
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Макс. girth</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={!cart.cartSize?.enabled}
                      value={row.maxGirthCm}
                      onChange={(e) => {
                        const next = [...(cart.cartSize?.limits ?? [])]
                        next[index] = {
                          ...row,
                          maxGirthCm: Math.max(0, Number(e.target.value) || 0),
                        }
                        patch({
                          cartSize: {
                            enabled: cart.cartSize?.enabled ?? false,
                            limits: next,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Правила ваги → доставка (JSON)</Label>
            <Textarea
              rows={3}
              className="font-mono text-xs"
              value={JSON.stringify(cart.deliveryWeightRules ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as CartCheckoutSettings['deliveryWeightRules']
                  if (Array.isArray(parsed)) patch({ deliveryWeightRules: parsed })
                } catch {
                  /* ignore incomplete JSON while typing */
                }
              }}
              placeholder='[{"maxWeightKg":10,"allowedMethods":["gls-courier"]}]'
            />
            <p className="text-xs text-muted-foreground">
              Працює лише коли розрахунок ваги увімкнено. Якщо вага кошика &gt; maxWeightKg — лишаються лише
              allowedMethods.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Способи доставки</CardTitle>
          <CardDescription>
            Оберіть, які варіанти доставки показувати клієнтам під час оформлення замовлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHECKOUT_DELIVERY_METHODS.map((method) => (
            <div key={method} className="flex items-center justify-between gap-4">
              <Label htmlFor={`delivery-${method}`}>{DELIVERY_METHOD_BACKSTAGE_LABELS[method]}</Label>
              <Switch
                id={`delivery-${method}`}
                checked={cart.enabledDeliveryMethods?.includes(method) ?? true}
                onCheckedChange={(checked) => toggleDeliveryMethod(method, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Способи оплати</CardTitle>
          <CardDescription>
            Оберіть, які способи оплати доступні клієнтам під час оформлення замовлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHECKOUT_PAYMENT_METHODS.map((method) => (
            <div key={method} className="flex items-center justify-between gap-4">
              <Label htmlFor={`payment-${method}`}>{PAYMENT_METHOD_BACKSTAGE_LABELS[method]}</Label>
              <Switch
                id={`payment-${method}`}
                checked={cart.enabledPaymentMethods?.includes(method) ?? true}
                onCheckedChange={(checked) => togglePaymentMethod(method, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оплата карткою онлайн</CardTitle>
          <CardDescription>
            Обирає провайдера, який обробляє метод «Оплата карткою онлайн» (
            <code>card-online</code>). Клієнт на checkout не бачить вибору — рішення приймається
            на сервері.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Провайдер</Label>
            <Select
              value={cart.onlineCardProvider ?? 'monopay'}
              onValueChange={(value) => patch({ onlineCardProvider: value as OnlineCardProvider })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ONLINE_CARD_PROVIDER_LABELS) as OnlineCardProvider[]).map(
                  (provider) => (
                    <SelectItem key={provider} value={provider}>
                      {ONLINE_CARD_PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Передача в ERP (Abra / Flexi)</Label>
            <Select
              value={cart.onlineCardErpExportMode ?? 'on_paid'}
              onValueChange={(value) =>
                patch({
                  onlineCardErpExportMode: value as CartCheckoutSettings['onlineCardErpExportMode'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_paid">Лише після успішної оплати</SelectItem>
                <SelectItem value="immediate">Одразу при оформленні</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Для Stripe (SK) і MonoPay (UA). Банківський переказ і dobierka завжди передаються одразу.
            </p>
          </div>
          <div className="space-y-2 rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Статус провайдерів</p>
            {(Object.keys(ONLINE_CARD_PROVIDER_LABELS) as OnlineCardProvider[]).map((provider) => {
              const configured = providersStatus?.[provider] ?? null
              return (
                <div key={provider} className="flex items-center justify-between gap-3 text-sm">
                  <span>{ONLINE_CARD_PROVIDER_LABELS[provider]}</span>
                  {configured === null ? (
                    <span className="text-xs text-muted-foreground">…</span>
                  ) : configured ? (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Налаштовано
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Не налаштовано
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мінімальна сума — роздріб</CardTitle>
          <CardDescription>
            Для гостей і клієнтів з роллю «Роздріб» (USER). Валюта деплою; порожньо = без
            обмеження.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Мінімальна сума товарів</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={cart.minOrderAmount ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim()
                patch({ minOrderAmount: raw ? Number(raw) : null })
              }}
              placeholder="Без обмеження"
            />
          </div>
          <div className="space-y-2">
            <Label>Якщо сума менша за мінімум</Label>
            <Select
              value={cart.belowMinOrderBehavior}
              onValueChange={(value) =>
                patch({
                  belowMinOrderBehavior: value as CartCheckoutSettings['belowMinOrderBehavior'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reject">Заборонити оформлення</SelectItem>
                <SelectItem value="add_packaging_fee">Додати суму пакування</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {cart.belowMinOrderBehavior === 'add_packaging_fee' ? (
            <div className="space-y-2">
              <Label>Додаткова сума пакування при низькому замовленні</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={cart.belowMinPackagingFee}
                onChange={(e) => patch({ belowMinPackagingFee: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мінімальна сума — гурт (WHOLESALER)</CardTitle>
          <CardDescription>
            Окремі умови для авторизованих клієнтів з роллю «Гурт». Незалежно від роздрібу.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Мінімальна сума товарів (гурт)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={cart.wholesalerMinOrderAmount ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim()
                patch({ wholesalerMinOrderAmount: raw ? Number(raw) : null })
              }}
              placeholder="Без обмеження"
            />
          </div>
          <div className="space-y-2">
            <Label>Якщо сума менша за мінімум (гурт)</Label>
            <Select
              value={cart.wholesalerBelowMinOrderBehavior}
              onValueChange={(value) =>
                patch({
                  wholesalerBelowMinOrderBehavior:
                    value as CartCheckoutSettings['wholesalerBelowMinOrderBehavior'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reject">Заборонити оформлення</SelectItem>
                <SelectItem value="add_packaging_fee">Додати суму пакування</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {cart.wholesalerBelowMinOrderBehavior === 'add_packaging_fee' ? (
            <div className="space-y-2">
              <Label>Додаткова сума пакування (гурт)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={cart.wholesalerBelowMinPackagingFee}
                onChange={(e) =>
                  patch({ wholesalerBelowMinPackagingFee: Number(e.target.value) || 0 })
                }
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Реквізити організації та PDF</CardTitle>
          <CardDescription>
            Показуються на сторінці успіху для банківського переказу та в PDF підтвердження.
            Можна взяти реквізити з налаштувань «Магазин» або вказати окремі тут (ринок:{' '}
            {marketRegion === 'sk' ? 'SK' : 'UA'}).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 sm:col-span-2 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Завантаження PDF на сторінці успіху</p>
            </div>
            <Switch
              checked={cart.orderPdfDownloadEnabled !== false}
              onCheckedChange={(orderPdfDownloadEnabled) => patch({ orderPdfDownloadEnabled })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:col-span-2 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">PDF у email підтвердження</p>
            </div>
            <Switch
              checked={cart.orderPdfEmailEnabled !== false}
              onCheckedChange={(orderPdfEmailEnabled) => patch({ orderPdfEmailEnabled })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Заголовок PDF (порожньо — дефолт за регіоном)</Label>
            <Input
              value={cart.orderPdfTitle ?? ''}
              onChange={(e) => patch({ orderPdfTitle: e.target.value })}
              placeholder={
                marketRegion === 'sk'
                  ? 'Potvrdenie objednávky / Order confirmation'
                  : 'Підтвердження замовлення'
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Джерело реквізитів компанії</Label>
            <Select
              value={cart.bankDetailsSource === 'store' ? 'store' : 'cart'}
              onValueChange={(value) =>
                patch({ bankDetailsSource: value as 'cart' | 'store' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="store">З налаштувань «Магазин»</SelectItem>
                <SelectItem value="cart">Окремі реквізити для кошика</SelectItem>
              </SelectContent>
            </Select>
            {cart.bankDetailsSource === 'store' ? (
              <p className="text-xs text-muted-foreground">
                Використовуються реквізити з вкладки «Магазин». Редагуйте їх там.
              </p>
            ) : null}
          </div>
          {cart.bankDetailsSource !== 'store' ? (
            <div className="sm:col-span-2">
              <CompanyBankDetailsFields
                value={cart.bankDetails ?? DEFAULT_CHECKOUT_BANK_DETAILS}
                marketRegion={marketRegion}
                onChange={(bankDetails) => patch({ bankDetails })}
              />
            </div>
          ) : null}
          <div className="space-y-2 sm:col-span-2">
            <Label>Призначення платежу</Label>
            <Input
              value={cart.paymentPurposeTemplate ?? ''}
              onChange={(e) => patch({ paymentPurposeTemplate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Підстановки: {'{orderNumber}'}, {'{orderNumbers}'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сторінка «Замовлення оформлено»</CardTitle>
          <CardDescription>Блок «Що далі?» і текст GDPR-згоди на checkout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>GDPR — текст згоди</Label>
            <Textarea
              rows={3}
              value={cart.gdprConsentText ?? ''}
              onChange={(e) => patch({ gdprConsentText: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Кроки «Що далі?»</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  patch({
                    nextSteps: [
                      ...(cart.nextSteps ?? []),
                      { title: '', description: '' },
                    ],
                  })
                }
              >
                Додати крок
              </Button>
            </div>
            {(cart.nextSteps ?? []).map((step, index) => (
              <div key={index} className="space-y-2 rounded-lg bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Крок {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={(cart.nextSteps ?? []).length <= 1}
                    onClick={() =>
                      patch({
                        nextSteps: (cart.nextSteps ?? []).filter((_, i) => i !== index),
                      })
                    }
                  >
                    Видалити
                  </Button>
                </div>
                <Input
                  placeholder="Заголовок"
                  value={step.title}
                  onChange={(e) => {
                    const next = [...(cart.nextSteps ?? [])]
                    next[index] = { ...next[index], title: e.target.value }
                    patch({ nextSteps: next })
                  }}
                />
                <Textarea
                  rows={2}
                  placeholder="Опис"
                  value={step.description}
                  onChange={(e) => {
                    const next = [...(cart.nextSteps ?? [])]
                    next[index] = { ...next[index], description: e.target.value }
                    patch({ nextSteps: next })
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FormSaveBar onSave={onSave} saving={saving} isDirty={isDirty} label="Зберегти налаштування кошика" />
    </div>
  )
}
