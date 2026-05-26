import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqCategories = [
  {
    title: 'Замовлення та оплата',
    questions: [
      {
        question: 'Як зробити замовлення?',
        answer: 'Ви можете зробити замовлення через наш сайт, додавши обрані рослини до кошика та оформивши замовлення. Також ви можете зателефонувати нам за номером +380 (67) 123-45-67 або написати на email.',
      },
      {
        question: 'Які способи оплати ви приймаєте?',
        answer: 'Ми приймаємо оплату онлайн карткою (Visa, Mastercard, Apple Pay, Google Pay), а також безготівковий розрахунок для юридичних осіб.',
      },
      {
        question: 'Чи можна оплатити частинами?',
        answer: 'Так, для великих замовлень (від 5000 грн) ми пропонуємо можливість оплати частинами: 50% передоплата та 50% при отриманні.',
      },
      {
        question: 'Як отримати рахунок для юридичної особи?',
        answer: 'Для отримання рахунку надішліть ваші реквізити на email info@zeleni-yanholy.ua або вкажіть їх при оформленні замовлення.',
      },
    ],
  },
  {
    title: 'Доставка',
    questions: [
      {
        question: 'В які регіони ви доставляєте?',
        answer: 'Ми доставляємо по всій Україні через Нову Пошту. Також можливий самовивіз з нашого розсадника у Вишгороді.',
      },
      {
        question: 'Скільки коштує доставка?',
        answer: 'Вартість доставки залежить від ваги та габаритів замовлення і розраховується за тарифами перевізника.',
      },
      {
        question: 'Як швидко відбувається доставка?',
        answer: 'Відправка замовлення відбувається протягом 1-2 робочих днів після підтвердження. Термін доставки Новою Поштою - 1-3 дні залежно від регіону.',
      },
      {
        question: 'Як упаковуються рослини для відправки?',
        answer: 'Рослини ретельно упаковуються з фіксацією кореневої системи, захистом крони та використанням спеціальних матеріалів для збереження вологості.',
      },
    ],
  },
  {
    title: 'Якість та гарантії',
    questions: [
      {
        question: 'Яку гарантію ви надаєте?',
        answer: 'Ми гарантуємо якість посадкового матеріалу. У разі пошкодження при транспортуванні або невідповідності опису - заміна або повернення коштів протягом 14 днів.',
      },
      {
        question: 'Що робити, якщо рослина прийшла пошкодженою?',
        answer: 'Сфотографуйте пошкодження одразу при отриманні та зв\'яжіться з нами протягом 24 годин. Ми вирішимо питання заміни або компенсації.',
      },
      {
        question: 'Як зберігати рослини до посадки?',
        answer: 'Рослини у контейнерах можна зберігати до посадки у напівтіні, регулярно поливаючи. Не рекомендується зберігати більше 2-3 тижнів без посадки.',
      },
    ],
  },
  {
    title: 'Догляд за рослинами',
    questions: [
      {
        question: 'Коли найкраще садити рослини?',
        answer: 'Рослини у контейнерах можна садити з весни до осені. Найкращий час - квітень-травень та вересень-жовтень, коли немає спеки та рослини встигають вкоренитися.',
      },
      {
        question: 'Як правильно поливати нещодавно посаджені рослини?',
        answer: 'У перший місяць після посадки поливайте рясно 2-3 рази на тиждень. Далі - за потребою, перевіряючи вологість грунту на глибині 5-7 см.',
      },
      {
        question: 'Чи потрібно підживлювати рослини?',
        answer: 'Рекомендуємо підживлення комплексними добривами навесні та влітку. Для хвойних використовуйте спеціальні добрива для хвойних рослин.',
      },
      {
        question: 'Чи надаєте консультації з догляду?',
        answer: 'Так, ми надаємо безкоштовні консультації з посадки та догляду за придбаними рослинами. Зв\'яжіться з нами по телефону або email.',
      },
    ],
  },
]

export default function FAQPage() {
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
              <span className="text-foreground">Часті питання</span>
            </nav>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Часті питання
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="max-w-3xl mx-auto mt-16 p-8 bg-secondary/50 rounded-2xl text-center">
            <h3 className="font-serif text-xl font-semibold mb-4">
              Не знайшли відповідь?
            </h3>
            <p className="text-muted-foreground mb-6">
              Зв&apos;яжіться з нами, і ми з радістю допоможемо
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+380671234567"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                +380 (67) 123-45-67
              </a>
              <a
                href="mailto:info@zeleni-yanholy.ua"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                info@zeleni-yanholy.ua
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
