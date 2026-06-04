'use client'

import Link from 'next/link'
import { ChevronRight, LogIn, UserPlus } from 'lucide-react'

import { CheckoutGuestCartPreview } from '@/components/checkout/checkout-guest-cart-preview'
import { Button } from '@/components/ui/button'

export function CheckoutGuestChoice({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <div className="mx-auto min-w-0 w-full max-w-4xl">
      <div className="mb-10 text-center">
        <p className="text-lg text-muted-foreground">Оберіть зручний спосіб оформлення</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative rounded-xl border-2 border-primary/80 bg-card/95 p-6 shadow-sm lg:p-8">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Рекомендовано
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">Увійти в акаунт</h2>
              <p className="text-sm text-muted-foreground">Вже маєте акаунт?</p>
            </div>
          </div>

          <ul className="mb-6 space-y-3">
            {[
              'Швидке оформлення зі збереженими даними',
              'Відстеження статусу замовлення',
              'Історія всіх замовлень',
              'Персональні знижки та акції',
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ChevronRight className="h-3 w-3 text-primary" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          <Button asChild className="w-full" size="lg">
            <Link href="/auth/login?redirect=/checkout">Увійти</Link>
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Немає акаунту?{' '}
            <Link
              href="/auth/register?redirect=/checkout"
              className="font-medium text-primary hover:underline"
            >
              Зареєструватися
            </Link>
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/95 p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Оформити як гість
              </h2>
              <p className="text-sm text-muted-foreground">Без реєстрації</p>
            </div>
          </div>

          <ul className="mb-6 space-y-3">
            {[
              'Швидке оформлення без реєстрації',
              'Підтвердження на email та SMS',
              'Можливість зареєструватися пізніше',
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <ChevronRight className="h-3 w-3" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" size="lg" onClick={onContinueAsGuest}>
            Продовжити як гість
          </Button>
        </div>
      </div>

      <CheckoutGuestCartPreview />
    </div>
  )
}
