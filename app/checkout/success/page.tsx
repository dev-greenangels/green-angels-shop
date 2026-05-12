'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { 
  Leaf, 
  CheckCircle2, 
  Package, 
  Mail, 
  Phone, 
  Truck,
  ArrowRight,
  Home,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'ZY-00000000'

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              Зелені Янголи
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon & Message */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Замовлення оформлено!
            </h1>
            <p className="text-lg text-muted-foreground">
              Дякуємо за ваше замовлення. Ми вже почали його обробку.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-background rounded-xl border p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Номер замовлення</p>
                <p className="text-xl font-bold text-foreground font-mono">{orderNumber}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>

            <Separator className="mb-6" />

            {/* What happens next */}
            <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
              Що далі?
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Підтвердження</p>
                  <p className="text-sm text-muted-foreground">
                    Найближчим часом ви отримаєте email та SMS з підтвердженням замовлення
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Обробка</p>
                  <p className="text-sm text-muted-foreground">
                    Наші спеціалісти підготують ваші рослини до відправки (1-2 робочі дні)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Відправка</p>
                  <p className="text-sm text-muted-foreground">
                    Ви отримаєте ТТН для відстеження посилки
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Отримання</p>
                  <p className="text-sm text-muted-foreground">
                    Огляньте рослини при отриманні. Ми гарантуємо якість!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-secondary/30 rounded-xl p-6 mb-8">
            <h3 className="font-medium text-foreground mb-4">Потрібна допомога?</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <a 
                href="tel:+380441234567" 
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">+38 (044) 123-45-67</p>
                  <p className="text-xs text-muted-foreground">Пн-Сб: 9:00-18:00</p>
                </div>
              </a>
              <a 
                href="mailto:info@zeleni-yanholy.ua" 
                className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">info@zeleni-yanholy.ua</p>
                  <p className="text-xs text-muted-foreground">Відповідаємо протягом доби</p>
                </div>
              </a>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-background rounded-xl border p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Інформація про доставку</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                Рослини ретельно пакуються для безпечної доставки
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                Доставка здійснюється у спеціальних коробках з вентиляцією
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                При отриманні огляньте рослини та перевірте комплектацію
              </li>
            </ul>
          </div>

          {/* Register CTA for guests */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-foreground mb-1">
                  Створіть акаунт
                </h3>
                <p className="text-sm text-muted-foreground">
                  Відстежуйте замовлення, зберігайте улюблені рослини та отримуйте персональні знижки
                </p>
              </div>
              <Button asChild>
                <Link href="/auth/register">
                  Зареєструватися
                </Link>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                На головну
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/catalog">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Продовжити покупки
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
