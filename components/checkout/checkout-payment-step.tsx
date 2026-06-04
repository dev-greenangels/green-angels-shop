'use client'

import { memo } from 'react'
import { Clock, CreditCard, Shield } from 'lucide-react'

import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import type { CheckoutFormValues } from '@/lib/validation/checkout-form'

export const CheckoutPaymentStep = memo(function CheckoutPaymentStep({
  formData,
  isLoading,
  onPatchForm,
  onBack,
}: {
  formData: CheckoutFormValues
  isLoading: boolean
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBack: () => void
}) {
  return (
    <div className={checkoutPanelClassName}>
      <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
        <CreditCard className="h-5 w-5 text-primary" />
        Оплата
      </h2>

      <div className="space-y-6">
        <div>
          <Label className="mb-4 block text-base font-medium">Спосіб оплати</Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => onPatchForm({ paymentMethod: value })}
            className="space-y-3"
          >
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.paymentMethod === 'card-online'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="card-online" id="card-online" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Оплата онлайн</p>
                <p className="text-sm text-muted-foreground">
                  Visa, Mastercard, Apple Pay, Google Pay - повна предоплата
                </p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.paymentMethod === 'bank-transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="bank-transfer" id="bank-transfer" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Банківський переказ</p>
                <p className="text-sm text-muted-foreground">Повна або часткова предоплата</p>
              </div>
            </label>
          </RadioGroup>
        </div>

      </div>

      <Separator className="my-6" />

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Безпечна оплата</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Обробка 1-2 години</span>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
          Назад
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[248px]"
        >
          {isLoading ? 'Оформлення...' : 'Оформити замовлення'}
        </Button>
      </div>
    </div>
  )
})
