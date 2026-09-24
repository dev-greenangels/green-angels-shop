'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Save, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PriceBasisBadge } from '@/components/ui/number-input'
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
import { DEFAULT_CHECKOUT_BANK_DETAILS, DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import type {
  CartCheckoutSettings,
  OnlineCardProvider,
  PackagingStrategySettings,
} from '@/lib/settings/types'
import {
  CHECKOUT_DELIVERY_METHODS,
  TOGGLEABLE_PAYMENT_METHODS,
  DELIVERY_METHOD_BACKSTAGE_LABELS,
  PAYMENT_METHOD_BACKSTAGE_LABELS,
  type CheckoutDeliveryMethodSlug,
  type CheckoutPaymentMethodSlug,
} from '@/lib/checkout/methods'

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
  const [testingNotify, setTestingNotify] = useState(false)
  const [testNotifyMessage, setTestNotifyMessage] = useState<string | null>(null)
  const [palletCapDraftSlug, setPalletCapDraftSlug] = useState('')
  const [palletCapDraftValue, setPalletCapDraftValue] = useState('')

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

  const packagingStrategy: PackagingStrategySettings = cart.packagingStrategy ?? {
    mode:
      cart.packagingMode === 'pallet'
        ? 'pallet'
        : cart.packagingMode === 'boxes'
          ? 'box'
          : 'flat',
    pallet: {
      enabled: cart.packagingMode === 'pallet',
      unitPrice: cart.palletSurcharge ?? 0,
      capacityByContainerSlug: {},
      autoPricingEnabled: false,
    },
  }
  const palletCapacities = packagingStrategy.pallet.capacityByContainerSlug ?? {}
  const palletCapacityEntries = Object.entries(palletCapacities)
  const hasPalletCapacities = palletCapacityEntries.some(([, n]) => n > 0)

  const patchPackagingMode = (packagingMode: CartCheckoutSettings['packagingMode']) => {
    const mode =
      packagingMode === 'pallet' ? 'pallet' : packagingMode === 'boxes' ? 'box' : 'flat'
    patch({
      packagingMode,
      packagingStrategy: {
        ...packagingStrategy,
        mode,
        pallet: {
          ...packagingStrategy.pallet,
          enabled: packagingMode === 'pallet' || packagingStrategy.pallet.enabled,
        },
      },
    })
  }

  const patchPallet = (partial: Partial<PackagingStrategySettings['pallet']>) => {
    const nextPallet = { ...packagingStrategy.pallet, ...partial }
    if (partial.autoPricingEnabled === true && !hasPalletCapacities) {
      nextPallet.autoPricingEnabled = false
    }
    patch({
      packagingStrategy: {
        ...packagingStrategy,
        mode: 'pallet',
        pallet: nextPallet,
      },
      packagingMode: 'pallet',
      palletSurcharge: nextPallet.unitPrice,
    })
  }

  const sendTestNotify = async () => {
    setTestingNotify(true)
    setTestNotifyMessage(null)
    try {
      const res = await fetch('/api/backstage/settings/cart-checkout/test-new-order-notify', {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; to?: string }
      if (!res.ok) {
        setTestNotifyMessage(data.error ?? 'Не вдалося надіслати тест.')
        return
      }
      setTestNotifyMessage(`Тест надіслано на ${data.to ?? cart.newOrderNotifyEmail}`)
    } catch {
      setTestNotifyMessage('Не вдалося надіслати тест.')
    } finally {
      setTestingNotify(false)
    }
  }

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
                ? 'Тарифи Packeta керуються у вкладці Settings → Packeta. Тут лише режим доставки та нейтральні опції кошика. Без тарифу для країни — доставка недоступна.'
                : cart.deliveryMode === 'fixed'
                  ? 'Однакова сума доставки для всіх способів (крім самовивозу, якщо увімкнено безкоштовно).'
                  : 'Доставка завжди 0.'}
            </p>
          </div>
          {cart.deliveryMode === 'fixed' || cart.deliveryMode === 'carrier_rates' ? (
            <div className="space-y-2">
              <Label>
                {cart.deliveryMode === 'carrier_rates'
                  ? 'Fallback лише для UA/NP методів без таблиці (не для Packeta/GLS)'
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
          <div className="space-y-4 sm:col-span-2 rounded-lg border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">Пакування</p>
              <p className="text-xs text-muted-foreground">
                Пакувальна коробка — матеріал магазину (не посилка перевізника і не палета).
                Ціни пакування не конвертуються при зміні NET/GROSS — змінюється лише інтерпретація.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Ціни пакування вводяться як</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="packaging-price-basis"
                    checked={cart.packagingAmountsAreNet === true}
                    onChange={() => patch({ packagingAmountsAreNet: true })}
                  />
                  NET — без ПДВ
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="packaging-price-basis"
                    checked={cart.packagingAmountsAreNet !== true}
                    onChange={() => patch({ packagingAmountsAreNet: false })}
                  />
                  GROSS — з ПДВ
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {cart.packagingAmountsAreNet === true
                  ? 'NET: ПДВ рахується за податковим режимом замовлення (SK / OSS / reverse charge).'
                  : 'GROSS: сума вже з ПДВ; повторно не додається.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Режим пакування</Label>
              <Select
                value={cart.packagingMode ?? 'flat'}
                onValueChange={(value) =>
                  patchPackagingMode(value as CartCheckoutSettings['packagingMode'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Фіксована сума</SelectItem>
                  <SelectItem value="boxes">BOX — коробки</SelectItem>
                  <SelectItem value="pallet">PALLET — палети</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(cart.packagingMode ?? 'flat') === 'flat' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Фіксована сума пакування</Label>
                  <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
                </div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cart.packagingAmount}
                  onChange={(e) => patch({ packagingAmount: Number(e.target.value) || 0 })}
                />
              </div>
            ) : (cart.packagingMode ?? 'flat') === 'pallet' ? (
              <div className="space-y-5">
                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    PALLET — палети (без коробок)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Occupancy = Σ(qty / capacity[slug]), ceil → кількість палет. AUTO-ціна на
                    checkout лише коли увімкнено autoPricingEnabled і є capacities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Ціна однієї палети</Label>
                      <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={packagingStrategy.pallet.unitPrice ?? 0}
                      onChange={(e) =>
                        patchPallet({ unitPrice: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Місткість за slug контейнера</Label>
                    <p className="text-xs text-muted-foreground">
                      VariantAttributeValue.slug атрибута CONTAINER — не перекладені назви. Без
                      вигаданих дефолтів. Вкажіть slug і capacity, натисніть «Додати».
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                      <Input
                        placeholder="slug"
                        value={palletCapDraftSlug}
                        onChange={(e) => setPalletCapDraftSlug(e.target.value)}
                      />
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="capacity"
                        value={palletCapDraftValue}
                        onChange={(e) => setPalletCapDraftValue(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const slug = palletCapDraftSlug.trim()
                          const capacity = Math.max(0, Number(palletCapDraftValue) || 0)
                          if (!slug) return
                          patchPallet({
                            capacityByContainerSlug: { ...palletCapacities, [slug]: capacity },
                          })
                          setPalletCapDraftSlug('')
                          setPalletCapDraftValue('')
                        }}
                      >
                        Додати
                      </Button>
                    </div>
                    {palletCapacityEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Рядків ще немає.</p>
                    ) : (
                      <div className="space-y-2">
                        {palletCapacityEntries.map(([slug, capacity]) => (
                          <div
                            key={slug}
                            className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                          >
                            <Input value={slug} readOnly className="bg-muted/40" />
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={capacity}
                              onChange={(e) => {
                                const next = {
                                  ...palletCapacities,
                                  [slug]: Math.max(0, Number(e.target.value) || 0),
                                }
                                patchPallet({
                                  capacityByContainerSlug: next,
                                  autoPricingEnabled:
                                    Object.values(next).some((n) => n > 0) &&
                                    packagingStrategy.pallet.autoPricingEnabled,
                                })
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = { ...palletCapacities }
                                delete next[slug]
                                patchPallet({
                                  capacityByContainerSlug: next,
                                  autoPricingEnabled:
                                    Object.values(next).some((n) => n > 0) &&
                                    packagingStrategy.pallet.autoPricingEnabled,
                                })
                              }}
                            >
                              Видалити
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>AUTO-ціноутворення палет на checkout</Label>
                      <p className="text-xs text-muted-foreground">
                        Увімкніть лише після capacities. Інакше палетна лінія = 0.
                      </p>
                    </div>
                    <Switch
                      checked={packagingStrategy.pallet.autoPricingEnabled === true}
                      disabled={!hasPalletCapacities}
                      onCheckedChange={(autoPricingEnabled) =>
                        patchPallet({ autoPricingEnabled })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    BOX — коробки (packaging box)
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Ціна однієї коробки</Label>
                      <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cart.boxUnitPrice ?? 0}
                      onChange={(e) => patch({ boxUnitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Рахувати коробки за вагою товарів</Label>
                      <p className="text-xs text-muted-foreground">
                        Незалежно від спліту посилок перевізника (maxParcelWeightKg).
                      </p>
                    </div>
                    <Switch
                      checked={(cart.boxMaxWeightKg ?? 0) > 0}
                      onCheckedChange={(on) =>
                        patch({
                          boxMaxWeightKg: on
                            ? (cart.boxMaxWeightKg ?? 0) > 0
                              ? cart.boxMaxWeightKg!
                              : 15
                            : 0,
                        })
                      }
                    />
                  </div>
                  {(cart.boxMaxWeightKg ?? 0) > 0 ? (
                    <div className="space-y-2">
                      <Label>Maximum product weight per packaging box (kg)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={cart.boxMaxWeightKg ?? 0}
                        onChange={(e) =>
                          patch({ boxMaxWeightKg: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Рахувати коробки за транспортним обʼємом</Label>
                      <p className="text-xs text-muted-foreground">
                        Транспортний обʼєм = L×W×H / 1000 (літри з габаритів варіанта). Це не
                        обʼєм горщика (volumeLiters). Зазвичай вимкнено, доки в каталозі немає
                        L/W/H.
                      </p>
                    </div>
                    <Switch
                      checked={(cart.boxMaxVolumeL ?? 0) > 0}
                      onCheckedChange={(on) =>
                        patch({
                          boxMaxVolumeL: on
                            ? (cart.boxMaxVolumeL ?? 0) > 0
                              ? cart.boxMaxVolumeL!
                              : 50
                            : 0,
                        })
                      }
                    />
                  </div>
                  {(cart.boxMaxVolumeL ?? 0) > 0 ? (
                    <div className="space-y-2">
                      <Label>Макс. транспортний обʼєм на коробку (л)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={cart.boxMaxVolumeL ?? 0}
                        onChange={(e) =>
                          patch({ boxMaxVolumeL: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Legacy: палети від коробок
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Увімкнути доплату за палети (legacy)</Label>
                      <p className="text-xs text-muted-foreground">
                        Legacy: palletCount = floor(boxCount / boxesPerPallet). Для незалежних
                        палет оберіть режим PALLET.
                      </p>
                    </div>
                    <Switch
                      checked={(cart.boxesPerPallet ?? 0) > 0}
                      onCheckedChange={(on) =>
                        patch({
                          boxesPerPallet: on
                            ? (cart.boxesPerPallet ?? 0) > 0
                              ? cart.boxesPerPallet!
                              : 1
                            : 0,
                        })
                      }
                    />
                  </div>
                  {(cart.boxesPerPallet ?? 0) > 0 ? (
                    <>
                      <div className="space-y-2">
                        <Label>Коробок на палету</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={cart.boxesPerPallet ?? 0}
                          onChange={(e) =>
                            patch({
                              boxesPerPallet: Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Ціна / доплата за палету</Label>
                          <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
                        </div>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={cart.palletSurcharge ?? 0}
                          onChange={(e) =>
                            patch({ palletSurcharge: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
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
                  : 'Legacy UA — можна увімкнути вручну.'}
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
          <div className="space-y-2 sm:col-span-2 rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 dark:bg-amber-950/20">
            <p className="text-sm font-medium">Cash on delivery (COD)</p>
            <p className="text-xs text-muted-foreground">
              Customer COD pricing and carrier COD costs are configured per carrier (Packeta → COD
              A/B/C; other carriers in their tabs). Legacy global{' '}
              <code className="text-xs">codFeeAmount</code> /{' '}
              <code className="text-xs">codFeeMode</code> remain stored as compatibility fallback
              only — not editable here.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Weight calculation (GLOBAL)</Label>
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
                  Якщо увімкнені обидва режими — береться max(факт, об&apos;ємна) × кількість.
                  Типово 5000. Global cart weight engine — used before carrier selection.
                </p>
              </div>
              <div className="space-y-2 border-t border-border/60 pt-3">
                <Label htmlFor="cart-default-missing-weight">
                  Default weight when product has no weight (kg)
                </Label>
                <Input
                  id="cart-default-missing-weight"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={cart.defaultMissingWeightKg ?? 1}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    patch({
                      defaultMissingWeightKg:
                        n > 0 ? n : DEFAULT_CART_CHECKOUT_SETTINGS.defaultMissingWeightKg,
                    })
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Global product/cart-weight fallback (same persisted path). Used when calculating
                  shipment weight before a carrier is chosen. Does not change catalog variant
                  weight. Not a Packeta setting.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Carrier transport (not edited here)</Label>
            <div className="space-y-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              <p>
                Packeta transport limits, tariffs, fuel/toll, insurance, and COD → Settings →
                Packeta.
              </p>
              <p>
                GLS transport limits and tariffs → Settings → GLS.
              </p>
              <p>
                <code className="text-xs">cartSize.limits</code> is a server projection from
                carrierConfigs.*.services — not an editable Cart field.
              </p>
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
          {TOGGLEABLE_PAYMENT_METHODS.map((method) => (
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
          <CardTitle>Оплата при отриманні для самовивозу</CardTitle>
          <CardDescription>
            Дозволяє клієнту обрати оплату при отриманні замовлення при самовивозі. За замовчуванням
            вимкнено.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="allow-pay-on-pickup">Увімкнути pay-on-pickup</Label>
            <Switch
              id="allow-pay-on-pickup"
              checked={cart.allowPayOnPickup === true}
              onCheckedChange={(allowPayOnPickup) => patch({ allowPayOnPickup })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сповіщення про замовлення</CardTitle>
          <CardDescription>
            Надсилати менеджеру email після створення нового замовлення (не клієнту).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="new-order-notify-enabled">Email про нове замовлення</Label>
            <Switch
              id="new-order-notify-enabled"
              checked={cart.newOrderNotifyEmailEnabled === true}
              onCheckedChange={(newOrderNotifyEmailEnabled) =>
                patch({ newOrderNotifyEmailEnabled })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-order-notify-email">Email для сповіщень</Label>
            <Input
              id="new-order-notify-email"
              type="email"
              value={cart.newOrderNotifyEmail ?? ''}
              onChange={(e) => patch({ newOrderNotifyEmail: e.target.value })}
              placeholder="manager@example.com"
              disabled={cart.newOrderNotifyEmailEnabled !== true}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!cart.newOrderNotifyEmail?.trim() || testingNotify}
            onClick={() => void sendTestNotify()}
          >
            {testingNotify ? 'Надсилання…' : 'Надіслати тестовий email'}
          </Button>
          {testNotifyMessage ? (
            <p className="text-sm text-muted-foreground">{testNotifyMessage}</p>
          ) : null}
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
              <div className="flex items-center gap-2">
                <Label>Додаткова сума пакування при низькому замовленні</Label>
                <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
              </div>
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
              <div className="flex items-center gap-2">
                <Label>Додаткова сума пакування (гурт)</Label>
                <PriceBasisBadge areNet={cart.packagingAmountsAreNet === true} />
              </div>
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
