import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function TermsPage() {
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
              <span className="text-foreground">Умови використання</span>
            </nav>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Умови використання
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto prose prose-green">
            <p className="text-muted-foreground text-lg mb-8">
              Останнє оновлення: 1 лютого 2024 року
            </p>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                1. Загальні положення
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Ці Умови використання регулюють відносини між ФОП &quot;Зелені Янголи&quot; 
                  (далі - &quot;Продавець&quot;) та покупцями товарів через інтернет-магазин 
                  zeleni-yanholy.ua (далі - &quot;Сайт&quot;).
                </p>
                <p>
                  Оформлюючи замовлення на Сайті, ви підтверджуєте свою згоду з цими 
                  Умовами використання та зобов&apos;язуєтесь їх дотримуватись.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                2. Оформлення замовлення
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Замовлення оформлюються через Сайт, по телефону або електронною поштою.
                </p>
                <p>
                  Після оформлення замовлення на вказану вами електронну адресу надходить 
                  підтвердження з деталями замовлення.
                </p>
                <p>
                  Продавець залишає за собою право відмовити у виконанні замовлення у 
                  випадку відсутності товару на складі або неможливості зв&apos;язатися з покупцем.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                3. Ціни та оплата
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Всі ціни на Сайті вказані в українських гривнях та включають ПДВ.
                </p>
                <p>
                  Продавець залишає за собою право змінювати ціни без попередження. 
                  Ціна замовлення фіксується на момент його оформлення.
                </p>
                <p>
                  Способи оплати: картою онлайн, накладний платіж, безготівковий розрахунок.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                4. Доставка
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Доставка здійснюється по всій території України службами Нова Пошта та Укрпошта.
                </p>
                <p>
                  Терміни доставки залежать від обраного способу та регіону і зазвичай становлять 1-7 робочих днів.
                </p>
                <p>
                  Вартість доставки розраховується відповідно до тарифів перевізника 
                  та залежить від ваги та габаритів замовлення.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                5. Повернення та обмін
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Покупець має право повернути або обміняти товар належної якості протягом 
                  14 днів з моменту отримання, якщо товар не був у використанні та збережено 
                  його товарний вигляд.
                </p>
                <p>
                  Для рослин діють особливі умови повернення: повернення приймається тільки 
                  у випадку пошкодження при транспортуванні або невідповідності сорту. 
                  Претензії приймаються протягом 24 годин з моменту отримання з наданням фото.
                </p>
                <p>
                  Вартість зворотної доставки оплачується покупцем, крім випадків повернення 
                  товару неналежної якості.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                6. Гарантії
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Продавець гарантує якість посадкового матеріалу на момент продажу.
                </p>
                <p>
                  Гарантія не поширюється на випадки пошкодження рослин внаслідок неправильного 
                  догляду, несприятливих погодних умов або механічних пошкоджень після отримання.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                7. Конфіденційність
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Ми поважаємо вашу конфіденційність та захищаємо ваші персональні дані 
                  відповідно до Закону України &quot;Про захист персональних даних&quot;.
                </p>
                <p>
                  Ваші дані використовуються виключно для обробки замовлень та комунікації 
                  з вами і не передаються третім особам без вашої згоди.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                8. Контактна інформація
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong className="text-foreground">ФОП &quot;Зелені Янголи&quot;</strong></p>
                <p>Адреса: Київська обл., м. Вишгород, вул. Садова, 15</p>
                <p>Телефон: +380 (67) 123-45-67</p>
                <p>Email: info@zeleni-yanholy.ua</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
