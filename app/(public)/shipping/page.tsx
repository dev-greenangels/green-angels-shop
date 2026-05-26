import Link from 'next/link'
import { ChevronRight, Truck, Package, CreditCard, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        {/* Header */}
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-foreground transition-colors">
                Головна
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Доставка та оплата</span>
            </nav>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Доставка та оплата
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Delivery methods */}
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Способи доставки
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      Нова Пошта
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-muted-foreground">
                    <p>Доставка у відділення або поштомат по всій Україні.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Термін: 1-3 дні
                      </li>
                      <li className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Відстеження посилки онлайн
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      Самовивіз
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-muted-foreground">
                    <p>
                      Ви можете забрати замовлення особисто з нашого розсадника. 
                      Це чудова можливість побачити весь асортимент та отримати консультацію.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="font-medium text-foreground">Адреса:</p>
                        <p>Київська обл., м. Вишгород, вул. Садова, 15</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Графік роботи:</p>
                        <p>Пн-Пт: 9:00-18:00, Сб: 9:00-15:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Shipping cost */}
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Вартість доставки
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold">Сума замовлення</th>
                      <th className="text-left py-4 px-4 font-semibold">Вартість доставки</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Нова Пошта</td>
                      <td className="py-4 px-4">За тарифами перевізника</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Самовивіз</td>
                      <td className="py-4 px-4">Без додаткової плати за доставку</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Payment methods */}
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Способи оплати
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-secondary/30 rounded-xl">
                  <CreditCard className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Карткою онлайн</h3>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard, Apple Pay, Google Pay через захищену платіжну систему
                  </p>
                </div>
                <div className="p-6 bg-secondary/30 rounded-xl">
                  <ShieldCheck className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Безготівковий</h3>
                  <p className="text-sm text-muted-foreground">
                    Для юридичних осіб з ПДВ або без
                  </p>
                </div>
              </div>
            </section>

            {/* Packaging */}
            <section className="p-8 bg-primary/5 rounded-2xl">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Упаковка рослин
              </h2>
              <p className="text-muted-foreground mb-6">
                Ми дбаємо про те, щоб рослини дісталися до вас у найкращому стані:
              </p>
              <ul className="grid sm:grid-cols-2 gap-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <span>Фіксація кореневої системи для запобігання пошкодженню</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <span>Захист крони спеціальною сіткою або папером</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <span>Використання вологоутримуючих матеріалів</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <span>Надійні коробки з маркуванням &quot;Обережно, рослини&quot;</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
