import { CheckCircle2, Truck } from 'lucide-react'

import { AboutImage, AboutVideoEmbed } from '@/components/about/about-media'
import { AboutStatsSection } from '@/components/about/about-stats-section'
import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ABOUT_CMS_IMAGES,
  ABOUT_VIDEO_EMBED,
  deliveryCities,
  productLines,
} from '@/lib/about/content'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { cn } from '@/lib/utils'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getLocale, getTranslations } from 'next-intl/server'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { Link } from '@/i18n/navigation'

const whyUsPoints = [
  'Якісні рослини від виробника за вигідною ціною',
  'Близько 500 видів — від базових до ексклюзивних',
  'Оперативна доставка по всій Україні',
  'Хвойні та листяні кущі, дерева для ландшафтного дизайну',
  'Живопліт, сад у східному стилі, альпійська гірка чи рокарій',
  'Вигідні умови для гурту, садових центрів і ландшафтників',
]

export const metadata = {
  title: 'Про нас · Зелені Янголи',
  description:
    'Розсадник «Зелені Янголи» — виробник посадкового матеріалу з Західної України. Власне виробництво, доставка по Україні.',
}

export default async function AboutPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const catalogRootSlug = await fetchCatalogRootSlug(locale)
  const catalogHref = resolveCatalogHref(catalogRootSlug)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('about'))}
            />
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
              Зелені Янголи™ — звідки взялися та хто вони такі?
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'space-y-20 py-12 md:space-y-24 md:py-16')}>
          <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Зелені янголи — це рослини. Вони укривають нас від спеки, утримують воду, очищують
                повітря, заспокоюють та дарують красу. Вони оберігають наш дім, наше довкілля, наше
                майбутнє.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Засновник та власник розсадника «Зелені Янголи» Ярослав Недолуженко — біолог за
                фахом та фермер у душі. У 2000 році почав розвиватися в зеленому бізнесі як молодий
                ландшафтний дизайнер, а в 2006 році разом із дружиною Андріанною відкрили свій
                перший садовий центр. Ярослав завжди мріяв працювати на землі та вирощувати рослини.
                Його девіз — «Хотіти, ставити цілі, діяти!» — і завдяки цьому кредо за 5 років на
                занедбаній території виріс один із провідних розсадників Західної України.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Раніше компанія була відома під назвою «Ландшафт Центр Ужгород», а влітку 2016 року
                народилися назва та бренд «Зелені Янголи». У вересні 2016 року новостворений бренд
                «вистрілив» на «Садовому фестивалі» та виграв перше місце за кращий стенд. Того ж
                року була зареєстрована торгова марка «Зелені Янголи»™ та логотип «Крила».
              </p>
            </div>
            <AboutImage
              src={ABOUT_CMS_IMAGES.founders}
              alt="Андріанна та Ярослав Недолуженко — засновники розсадника «Зелені Янголи»"
              className="aspect-[4/3] shadow-md ring-1 ring-border/40"
              priority
            />
          </section>

          <AboutStatsSection />

          <section className="mx-auto max-w-5xl">
            <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Чому ми?
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Для багатьох сад — це зона комфорту, улюблене хобі та гордість, а робота в саду є
                найкращим відпочинком, методом оновлення та зняття стресу. Ми працюємо для того,
                щоб ви отримували від свого саду ще більше задоволення — пропонуємо якісні рослини,
                вигідну ціну, оперативну доставку та широкий асортимент. Створіть разом з нами
                живопліт мрії, сад у східному стилі, природній сад, альпійську гірку чи рокарій.
              </p>
              <p>
                Немає власної ділянки? Створіть міні-сад на балконі, терасі чи даху, або разом із
                членами ОСББ подбайте про озеленення прибудинкової території. Довіртеся виробнику
                — підкажемо, що і де посадити, які рослини квітнуть весною, влітку чи восени, що
                обрати для сонця, тіні чи біля води, як зробити живу огорожу.
              </p>
              <p>
                Для тих, хто працює в сфері зеленого бізнесу, ландшафтного дизайну та архітектури —
                пропонуємо вигідні умови співпраці. Постачаємо якісні рослини за найкращою ціною
                українського виробника, організуємо доставку та допоможемо сформувати асортимент.
                Розсадник «Зелені Янголи» — партнер вашого успіху та креативних ідей.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {whyUsPoints.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-foreground/90">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={catalogHref}>Перейти в каталог</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contacts">Контакти та гурт</Link>
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Наша продукція
            </h2>
            <div className="grid gap-8">
              {productLines.map((line, index) => (
                <Card
                  key={line.title}
                  className="overflow-hidden border-border/60 shadow-sm"
                >
                  <CardContent className="grid items-center gap-6 p-0 md:grid-cols-2">
                    <AboutImage
                      src={line.image}
                      alt={line.imageAlt}
                      className={cn(
                        'aspect-square min-h-[240px] md:aspect-auto md:min-h-[280px]',
                        index % 2 === 1 && 'md:order-2',
                      )}
                    />
                    <div className={cn('space-y-3 p-6 md:p-8', index % 2 === 1 && 'md:order-1')}>
                      <h3 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                        {line.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                        {line.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                Коротко про розсадник «Зелені Янголи»
              </h2>
              <p className="mt-2 text-muted-foreground">
                Відео про наше виробництво, поля та команду
              </p>
            </div>
            <AboutVideoEmbed
              src={ABOUT_VIDEO_EMBED}
              title="Коротко про розсадник Зелені Янголи"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/20">
            <div className="grid md:grid-cols-2">
              <AboutImage
                src={ABOUT_CMS_IMAGES.delivery}
                alt="Доставка рослин по Україні"
                className="min-h-[260px] md:min-h-full"
              />
              <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    Доставка рослин
                  </h2>
                  <p className="leading-relaxed text-muted-foreground">
                    Лише у 2018 році ми доставили близько{' '}
                    <strong className="text-foreground">5000 замовлень</strong> поштою та понад{' '}
                    <strong className="text-foreground">300 тонн</strong> рослин вантажними
                    перевезеннями. Рослини від «Зелених Янголів» тепер ростуть по всій Україні.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Основні напрямки: {deliveryCities.join(', ')}.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    Відповідально пакуємо рослини, працюємо з надійними перевізниками та доставляємо
                    як роздрібні, так і гуртові замовлення — від невеликих партій на палетах до
                    великих вантажних перевезень.
                  </p>
                </div>
                <Button variant="outline" asChild className="w-fit">
                  <Link href="/shipping">Умови оплати та доставки</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
