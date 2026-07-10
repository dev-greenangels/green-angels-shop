'use client'

import { Save } from 'lucide-react'

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
import type { CartCheckoutSettings } from '@/lib/settings/types'
import {
  CHECKOUT_DELIVERY_METHODS,
  CHECKOUT_PAYMENT_METHODS,
  DELIVERY_METHOD_BACKSTAGE_LABELS,
  PAYMENT_METHOD_BACKSTAGE_LABELS,
  type CheckoutDeliveryMethodSlug,
  type CheckoutPaymentMethodSlug,
} from '@/lib/checkout/methods'

type CartCheckoutSettingsFormProps = {
  cart: CartCheckoutSettings
  onChange: (cart: CartCheckoutSettings) => void
  onSave: () => void
  saving: boolean
}

export function CartCheckoutSettingsForm({
  cart,
  onChange,
  onSave,
  saving,
}: CartCheckoutSettingsFormProps) {
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
                <SelectItem value="carrier_rates">За тарифами перевізника</SelectItem>
                <SelectItem value="fixed">Фіксована сума</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              «За тарифами перевізника» — сума невідома до відправлення; не додається до «Разом»
            </p>
          </div>
          {cart.deliveryMode === 'fixed' ? (
            <div className="space-y-2">
              <Label>Сума доставки (₴)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={cart.deliveryAmount}
                onChange={(e) => patch({ deliveryAmount: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Пакування (₴)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={cart.packagingAmount}
              onChange={(e) => patch({ packagingAmount: Number(e.target.value) || 0 })}
            />
          </div>
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
          </div>
          <div className="flex items-center justify-between gap-4 sm:col-span-2">
            <div>
              <Label>ПДВ уже в цінах товарів</Label>
              <p className="text-xs text-muted-foreground">
                Якщо увімкнено — податок показується інформативно, без додавання до суми
              </p>
            </div>
            <Switch
              checked={cart.taxIncluded}
              onCheckedChange={(taxIncluded) => patch({ taxIncluded })}
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
          <CardTitle>Мінімальна сума замовлення</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Мінімальна сума товарів (₴, порожньо = без обмеження)</Label>
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
                patch({ belowMinOrderBehavior: value as CartCheckoutSettings['belowMinOrderBehavior'] })
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
              <Label>Додаткова сума пакування при низькому замовленні (₴)</Label>
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
          <CardTitle>Реквізити організації (банківський переказ)</CardTitle>
          <CardDescription>
            Показуються на сторінці успішного оформлення для оплати `bank-transfer` /
            `bank-transfer-legal`
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Назва організації / ФОП</Label>
            <Input
              value={cart.bankDetails?.organizationName ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: {
                    ...(cart.bankDetails ?? {
                      organizationName: '',
                      edrpou: '',
                      iban: '',
                      bankName: '',
                      mfo: '',
                      legalAddress: '',
                      taxStatus: '',
                    }),
                    organizationName: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>ЄДРПОУ / ІПН</Label>
            <Input
              value={cart.bankDetails?.edrpou ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, edrpou: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>МФО</Label>
            <Input
              value={cart.bankDetails?.mfo ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, mfo: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>IBAN</Label>
            <Input
              value={cart.bankDetails?.iban ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, iban: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Банк</Label>
            <Input
              value={cart.bankDetails?.bankName ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, bankName: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Юридична адреса</Label>
            <Input
              value={cart.bankDetails?.legalAddress ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, legalAddress: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Податковий статус</Label>
            <Input
              placeholder="напр. Платник ПДВ / Не платник ПДВ"
              value={cart.bankDetails?.taxStatus ?? ''}
              onChange={(e) =>
                patch({
                  bankDetails: { ...cart.bankDetails, taxStatus: e.target.value },
                })
              }
            />
          </div>
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

      <Button type="button" onClick={onSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        Зберегти налаштування кошика
      </Button>
    </div>
  )
}
