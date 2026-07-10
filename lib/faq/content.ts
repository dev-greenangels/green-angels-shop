import { formatStoreAddress, getStoreEmails, getStorePhones } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'

export type FaqItem = {
  question: string
  answer: string
}

export type FaqCategory = {
  title: string
  questions: FaqItem[]
}

function formatPhonesList(store: StoreContactSettings): string {
  const phones = getStorePhones(store)
  if (phones.length === 0) return ''
  if (phones.length === 1) return phones[0].phone
  return phones.map((item) => `${item.label.toLowerCase()}: ${item.phone}`).join(', ')
}

function formatEmailsList(store: StoreContactSettings): string {
  const emails = getStoreEmails(store)
  if (emails.length === 0) return ''
  if (emails.length === 1) return emails[0].email
  return emails.map((item) => `${item.label.toLowerCase()}: ${item.email}`).join(', ')
}

export function buildFaqCategories(store: StoreContactSettings): FaqCategory[] {
  const address = formatStoreAddress(store)
  const phones = formatPhonesList(store)
  const emails = formatEmailsList(store)

  return [
    {
      title: 'Замовлення та оплата',
      questions: [
        {
          question: 'Як зробити замовлення?',
          answer: `Ви можете зробити замовлення через наш сайт, додавши обрані рослини до кошика та оформивши замовлення. Також ви можете зателефонувати нам (${phones}) або написати на email (${emails}).`,
        },
        {
          question: 'Які способи оплати ви приймаєте?',
          answer:
            'Ми приймаємо оплату онлайн карткою (Visa, Mastercard, Apple Pay, Google Pay), а також безготівковий розрахунок для юридичних осіб.',
        },
        {
          question: 'Чи можна оплатити частинами?',
          answer:
            'Так, для великих замовлень (від 5000 грн) ми пропонуємо можливість оплати частинами: 50% передоплата та 50% при отриманні.',
        },
        {
          question: 'Як отримати рахунок для юридичної особи?',
          answer: `Для отримання рахунку надішліть ваші реквізити на email (${emails}) або вкажіть їх при оформленні замовлення.`,
        },
      ],
    },
    {
      title: 'Доставка',
      questions: [
        {
          question: 'В які регіони ви доставляєте?',
          answer: `Ми доставляємо по всій Україні через Нову Пошту. Також можливий самовивіз з нашого розсадника за адресою: ${address}.`,
        },
        {
          question: 'Скільки коштує доставка?',
          answer:
            'Вартість доставки залежить від ваги та габаритів замовлення і розраховується за тарифами перевізника.',
        },
        {
          question: 'Як швидко відбувається доставка?',
          answer:
            'Відправка замовлення відбувається протягом 1-2 робочих днів після підтвердження. Термін доставки Новою Поштою - 1-3 дні залежно від регіону.',
        },
        {
          question: 'Як упаковуються рослини для відправки?',
          answer:
            'Рослини ретельно упаковуються з фіксацією кореневої системи, захистом крони та використанням спеціальних матеріалів для збереження вологості.',
        },
      ],
    },
    {
      title: 'Якість та гарантії',
      questions: [
        {
          question: 'Яку гарантію ви надаєте?',
          answer:
            'Ми гарантуємо якість посадкового матеріалу. У разі пошкодження при транспортуванні або невідповідності опису - заміна або повернення коштів протягом 14 днів.',
        },
        {
          question: 'Що робити, якщо рослина прийшла пошкодженою?',
          answer:
            "Сфотографуйте пошкодження одразу при отриманні та зв'яжіться з нами протягом 24 годин. Ми вирішимо питання заміни або компенсації.",
        },
        {
          question: 'Як зберігати рослини до посадки?',
          answer:
            'Рослини у контейнерах можна зберігати до посадки у напівтіні, регулярно поливаючи. Не рекомендується зберігати більше 2-3 тижнів без посадки.',
        },
      ],
    },
    {
      title: 'Догляд за рослинами',
      questions: [
        {
          question: 'Коли найкраще садити рослини?',
          answer:
            'Рослини у контейнерах можна садити з весни до осені. Найкращий час - квітень-травень та вересень-жовтень, коли немає спеки та рослини встигають вкоренитися.',
        },
        {
          question: 'Як правильно поливати нещодавно посаджені рослини?',
          answer:
            'У перший місяць після посадки поливайте рясно 2-3 рази на тиждень. Далі - за потребою, перевіряючи вологість грунту на глибині 5-7 см.',
        },
        {
          question: 'Чи потрібно підживлювати рослини?',
          answer:
            'Рекомендуємо підживлення комплексними добривами навесні та влітку. Для хвойних використовуйте спеціальні добрива для хвойних рослин.',
        },
        {
          question: 'Чи надаєте консультації з догляду?',
          answer: `Зв'яжіться з нами за телефоном (${phones}) або email (${emails}) — допоможемо з питаннями щодо посадки та догляду.`,
        },
      ],
    },
  ]
}
