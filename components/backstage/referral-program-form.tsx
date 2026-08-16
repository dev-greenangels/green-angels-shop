'use client'

import { Loader2, Save } from 'lucide-react'

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
import type { UpsertReferralProgramPayload } from '@/lib/backstage/referrals'

type ReferralProgramFormProps = {
  program: UpsertReferralProgramPayload
  onChange: (program: UpsertReferralProgramPayload) => void
  onSave: () => void
  saving: boolean
  isDirty?: boolean
}

export function ReferralProgramForm({ program, onChange, onSave, saving, isDirty = false }: ReferralProgramFormProps) {
  const patch = (partial: Partial<UpsertReferralProgramPayload>) =>
    onChange({ ...program, ...partial })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Реферальна програма</CardTitle>
          <CardDescription>
            Клієнти діляться персональним посиланням із кодом. Другу — знижка на перше замовлення,
            власнику коду — бали на рахунок після оплати замовлення друга.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="referral-active">Програма активна</Label>
              <p className="text-sm text-muted-foreground">
                Якщо вимкнено, нові коди не видаються, а знижки/бали не нараховуються.
              </p>
            </div>
            <Switch
              id="referral-active"
              checked={program.isActive}
              onCheckedChange={(isActive) => patch({ isActive })}
            />
          </div>

          <div className="space-y-2">
            <Label>Назва програми</Label>
            <Input
              value={program.name}
              maxLength={160}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Наприклад: Запроси друга"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Знижка для друга (referee)</CardTitle>
          <CardDescription>
            Застосовується автоматично до першого замовлення друга, оформленого за реферальним
            посиланням.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Тип знижки</Label>
            <Select
              value={program.refereeDiscountType}
              onValueChange={(value) =>
                patch({ refereeDiscountType: value as UpsertReferralProgramPayload['refereeDiscountType'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Відсоток</SelectItem>
                <SelectItem value="FIXED">Фіксована сума</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Значення знижки</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={program.refereeDiscountValue}
              onChange={(e) => patch({ refereeDiscountValue: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Мінімальна сума замовлення (опційно)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={program.minOrderSubtotal ?? ''}
              onChange={(e) =>
                patch({ minOrderSubtotal: e.target.value === '' ? null : Number(e.target.value) })
              }
              placeholder="Без мінімуму"
            />
          </div>
          <div className="space-y-2">
            <Label>Максимальна сума знижки (опційно)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={program.maxRefereeDiscount ?? ''}
              onChange={(e) =>
                patch({ maxRefereeDiscount: e.target.value === '' ? null : Number(e.target.value) })
              }
              placeholder="Без обмеження"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бали для власника коду (referrer)</CardTitle>
          <CardDescription>
            Нараховуються, коли замовлення друга переходить у статус «В обробці» або «Доставлено».
            1 бал = 1 грошова одиниця при списанні на власному чекауті.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Балів за замовлення друга</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={program.referrerPoints}
              onChange={(e) => patch({ referrerPoints: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Дні життя балів (опційно)</Label>
            <Input
              type="number"
              min={1}
              step="1"
              value={program.pointsExpireDays ?? ''}
              onChange={(e) =>
                patch({
                  pointsExpireDays: e.target.value === '' ? null : Math.max(1, Math.trunc(Number(e.target.value))),
                })
              }
              placeholder="Без обмеження"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookie реферального посилання</CardTitle>
          <CardDescription>
            Скільки днів зберігати код у cookie `ga-ref` після переходу за посиланням `?ref=CODE`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Днів дії cookie</Label>
            <Input
              type="number"
              min={1}
              max={365}
              step="1"
              value={program.cookieDays}
              onChange={(e) => patch({ cookieDays: Math.min(365, Math.max(1, Math.trunc(Number(e.target.value) || 30))) })}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Зберегти реферальну програму
      </Button>
    </div>
  )
}
