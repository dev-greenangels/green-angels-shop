import { formatStoreAddress, getStoreEmails, getStorePhones } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'
import type { MarketRegion } from '@/lib/settings/market'

export type FaqItem = {
  question: string
  answer: string
}

export type FaqCategory = {
  title: string
  questions: FaqItem[]
}

export type FaqLocale = 'uk' | 'en' | 'sk' | 'cs' | 'hu' | 'de'

type FaqVars = {
  phones: string
  emails: string
  address: string
}

function formatPhonesList(store: StoreContactSettings): string {
  const phones = getStorePhones(store)
  if (phones.length === 0) return ''
  if (phones.length === 1) return phones[0]!.phone
  return phones.map((item) => `${item.label.toLowerCase()}: ${item.phone}`).join(', ')
}

function formatEmailsList(store: StoreContactSettings): string {
  const emails = getStoreEmails(store)
  if (emails.length === 0) return ''
  if (emails.length === 1) return emails[0]!.email
  return emails.map((item) => `${item.label.toLowerCase()}: ${item.email}`).join(', ')
}

function fill(template: string, vars: FaqVars): string {
  return template
    .replaceAll('{phones}', vars.phones)
    .replaceAll('{emails}', vars.emails)
    .replaceAll('{address}', vars.address)
}

/** UA-market FAQ (Nova Poshta / грн) — only for region=ua. */
function buildUaFaq(vars: FaqVars): FaqCategory[] {
  return [
    {
      title: 'Замовлення та оплата',
      questions: [
        {
          question: 'Як зробити замовлення?',
          answer: fill(
            'Ви можете зробити замовлення через наш сайт, додавши обрані рослини до кошика та оформивши замовлення. Також ви можете зателефонувати нам ({phones}) або написати на email ({emails}).',
            vars,
          ),
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
          answer: fill(
            'Для отримання рахунку надішліть ваші реквізити на email ({emails}) або вкажіть їх при оформленні замовлення.',
            vars,
          ),
        },
      ],
    },
    {
      title: 'Доставка',
      questions: [
        {
          question: 'В які регіони ви доставляєте?',
          answer: fill(
            'Ми доставляємо по всій Україні через Нову Пошту. Також можливий самовивіз з нашого розсадника за адресою: {address}.',
            vars,
          ),
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
          answer: fill(
            "Зв'яжіться з нами за телефоном ({phones}) або email ({emails}) — допоможемо з питаннями щодо посадки та догляду.",
            vars,
          ),
        },
      ],
    },
  ]
}

/**
 * EU-market FAQ by locale.
 * Avoid inventing market-specific payment/delivery legal facts — point to Shipping / Contacts / Returns.
 * TODO(business): expand payment/carrier specifics per country when ops confirms copy.
 */
function buildEuFaq(locale: FaqLocale, vars: FaqVars): FaqCategory[] {
  const copy: Record<
    Exclude<FaqLocale, 'uk'>,
    {
      order: string
      howOrder: [string, string]
      payment: [string, string]
      invoice: [string, string]
      delivery: string
      where: [string, string]
      cost: [string, string]
      packing: [string, string]
      quality: string
      warranty: [string, string]
      damaged: [string, string]
      care: string
      plantWhen: [string, string]
      consult: [string, string]
    }
  > = {
    en: {
      order: 'Orders & payment',
      howOrder: [
        'How do I place an order?',
        'Add plants to your cart and complete checkout on the website. You can also contact us by phone ({phones}) or email ({emails}).',
      ],
      payment: [
        'Which payment methods are available?',
        'Available methods are shown at checkout and on the Shipping & payment page (card, bank transfer, and other options enabled for this shop).',
      ],
      invoice: [
        'How do I get an invoice for a company?',
        'Enter your company details at checkout or email your details to {emails}.',
      ],
      delivery: 'Delivery',
      where: [
        'Where do you deliver?',
        'Delivery options depend on the destination country selected at checkout. Pickup is available at our nursery: {address}. See the Shipping page for carriers and rates.',
      ],
      cost: [
        'How much does shipping cost?',
        'Shipping cost depends on weight, size and destination and is calculated from carrier tariffs at checkout.',
      ],
      packing: [
        'How are plants packed?',
        'We pack plants carefully — root system secured, canopy protected, moisture retained for transport.',
      ],
      quality: 'Quality & returns',
      warranty: [
        'What is your quality policy?',
        'We guarantee planting-material quality at sale. Transport damage and returns are described on the Returns page (including the 14-day withdrawal rules where applicable).',
      ],
      damaged: [
        'What if a plant arrives damaged?',
        'Photograph the damage on receipt and contact us promptly ({phones} / {emails}). We will arrange a replacement or remedy under our returns policy.',
      ],
      care: 'Plant care',
      plantWhen: [
        'When is the best time to plant?',
        'Container plants can be planted from spring to autumn. Mild periods in spring and early autumn are usually best for rooting.',
      ],
      consult: [
        'Do you offer planting advice?',
        'Yes — contact us at {phones} or {emails} for planting and care questions.',
      ],
    },
    sk: {
      order: 'Objednávka a platba',
      howOrder: [
        'Ako vytvorím objednávku?',
        'Pridajte rastliny do košíka a dokončite objednávku na webe. Môžete nás aj kontaktovať telefonicky ({phones}) alebo e-mailom ({emails}).',
      ],
      payment: [
        'Aké spôsoby platby prijímate?',
        'Dostupné spôsoby sú uvedené pri pokladni a na stránke Doprava a platba (karta, prevod a ďalšie zapnuté možnosti).',
      ],
      invoice: [
        'Ako získam faktúru pre firmu?',
        'Vyplňte firemné údaje pri objednávke alebo ich pošlite na {emails}.',
      ],
      delivery: 'Doprava',
      where: [
        'Kam doručujete?',
        'Možnosti dopravy závisia od cieľovej krajiny pri pokladni. Osobný odber je možný v škôlke: {address}. Podrobnosti nájdete na stránke Doprava.',
      ],
      cost: [
        'Koľko stojí doprava?',
        'Cena závisí od hmotnosti, rozmerov a destinácie a počíta sa podľa taríf dopravcu pri pokladni.',
      ],
      packing: [
        'Ako balíte rastliny?',
        'Rastliny balíme starostlivo — koreňový systém, koruna a vlhkosť na prepravu.',
      ],
      quality: 'Kvalita a vrátenie',
      warranty: [
        'Akú máte politiku kvality?',
        'Garantujeme kvalitu sadbového materiálu pri predaji. Poškodenie pri doprave a vrátenie sú popísané na stránke Vrátenie (vrátane 14-dňového odstúpenia, ak platí).',
      ],
      damaged: [
        'Čo ak rastlina príde poškodená?',
        'Odfotografujte poškodenie pri prevzatí a kontaktujte nás ({phones} / {emails}). Vyriešime výmenu alebo nápravu podľa pravidiel vrátenia.',
      ],
      care: 'Starostlivosť o rastliny',
      plantWhen: [
        'Kedy je najlepšie sadiť?',
        'Kontajnerové rastliny možno sadiť od jari do jesene. Najlepšie sú mierne jarné a skoré jesenné obdobia.',
      ],
      consult: [
        'Poskytujete poradenstvo?',
        'Áno — kontaktujte nás na {phones} alebo {emails}.',
      ],
    },
    cs: {
      order: 'Objednávka a platba',
      howOrder: [
        'Jak vytvořím objednávku?',
        'Přidejte rostliny do košíku a dokončete objednávku na webu. Můžete nás také kontaktovat telefonicky ({phones}) nebo e-mailem ({emails}).',
      ],
      payment: [
        'Jaké způsoby platby přijímáte?',
        'Dostupné způsoby jsou uvedeny u pokladny a na stránce Doprava a platba.',
      ],
      invoice: [
        'Jak získám fakturu pro firmu?',
        'Vyplňte firemní údaje při objednávce nebo je pošlete na {emails}.',
      ],
      delivery: 'Doprava',
      where: [
        'Kam doručujete?',
        'Možnosti dopravy závisí na cílové zemi u pokladny. Osobní odběr je možný ve školce: {address}. Podrobnosti najdete na stránce Doprava.',
      ],
      cost: [
        'Kolik stojí doprava?',
        'Cena závisí na hmotnosti, rozměrech a destinaci a počítá se podle tarifů dopravce u pokladny.',
      ],
      packing: [
        'Jak balíte rostliny?',
        'Rostliny balíme pečlivě — kořenový systém, koruna a vlhkost pro přepravu.',
      ],
      quality: 'Kvalita a vrácení',
      warranty: [
        'Jaká je vaše politika kvality?',
        'Garantujeme kvalitu sadebního materiálu při prodeji. Poškození při dopravě a vrácení jsou popsány na stránce Vrácení.',
      ],
      damaged: [
        'Co když rostlina přijde poškozená?',
        'Vyfoťte poškození při převzetí a kontaktujte nás ({phones} / {emails}).',
      ],
      care: 'Péče o rostliny',
      plantWhen: [
        'Kdy je nejlepší sázet?',
        'Kontejnerové rostliny lze sázet od jara do podzimu. Nejlepší jsou mírná jarní a raná podzimní období.',
      ],
      consult: [
        'Poskytujete poradenství?',
        'Ano — kontaktujte nás na {phones} nebo {emails}.',
      ],
    },
    hu: {
      order: 'Rendelés és fizetés',
      howOrder: [
        'Hogyan rendelhetek?',
        'Adja a növényeket a kosárhoz, és fejezze be a rendelést a weboldalon. Telefonon ({phones}) vagy e-mailben ({emails}) is elérhet minket.',
      ],
      payment: [
        'Milyen fizetési módok érhetők el?',
        'A elérhető módok a pénztárnál és a Szállítás és fizetés oldalon jelennek meg.',
      ],
      invoice: [
        'Hogyan kapok számlát cégnek?',
        'Adja meg cégadatait a rendelésnél, vagy küldje el őket ide: {emails}.',
      ],
      delivery: 'Szállítás',
      where: [
        'Hová szállítanak?',
        'A szállítási lehetőségek a pénztárnál választott célországtól függnek. Személyes átvétel a faiskolában: {address}. Részletek a Szállítás oldalon.',
      ],
      cost: [
        'Mennyibe kerül a szállítás?',
        'A díj a súlytől, mérettől és célállomástól függ, és a futár díjszabása szerint a pénztárnál számítódik.',
      ],
      packing: [
        'Hogyan csomagolják a növényeket?',
        'Gondosan csomagolunk — gyökér, korona és nedvesség a szállításhoz.',
      ],
      quality: 'Minőség és visszaküldés',
      warranty: [
        'Mi a minőségi politika?',
        'Garantáljuk az ültetőanyag minőségét az eladáskor. A szállítási kár és a visszaküldés a Visszaküldés oldalon van leírva.',
      ],
      damaged: [
        'Mi van, ha sérülten érkezik a növény?',
        'Fényképezze le az átvételkor, és azonnal jelezze ({phones} / {emails}).',
      ],
      care: 'Növényápolás',
      plantWhen: [
        'Mikor a legjobb ültetni?',
        'A konténeres növények tavasztól őszig ültethetők. A enyhe tavaszi és kora őszi időszak a legjobb.',
      ],
      consult: [
        'Adnak tanácsot?',
        'Igen — keressen minket: {phones} vagy {emails}.',
      ],
    },
    de: {
      order: 'Bestellung & Zahlung',
      howOrder: [
        'Wie bestelle ich?',
        'Legen Sie Pflanzen in den Warenkorb und schließen Sie die Bestellung auf der Website ab. Sie können uns auch telefonisch ({phones}) oder per E-Mail ({emails}) kontaktieren.',
      ],
      payment: [
        'Welche Zahlungsarten gibt es?',
        'Die verfügbaren Arten werden im Checkout und auf der Seite Versand & Zahlung angezeigt.',
      ],
      invoice: [
        'Wie erhalte ich eine Firmenrechnung?',
        'Geben Sie Firmendaten im Checkout an oder senden Sie sie an {emails}.',
      ],
      delivery: 'Lieferung',
      where: [
        'Wohin liefern Sie?',
        'Lieferoptionen hängen vom Zielland im Checkout ab. Abholung in der Baumschule: {address}. Details auf der Versand-Seite.',
      ],
      cost: [
        'Was kostet der Versand?',
        'Die Kosten hängen von Gewicht, Größe und Ziel ab und werden nach Spediteurstarifen im Checkout berechnet.',
      ],
      packing: [
        'Wie werden Pflanzen verpackt?',
        'Wir verpacken sorgfältig — Wurzel, Krone und Feuchtigkeit für den Transport.',
      ],
      quality: 'Qualität & Rückgabe',
      warranty: [
        'Wie ist Ihre Qualitätspolitik?',
        'Wir garantieren die Qualität des Pflanzmaterials beim Verkauf. Transportschäden und Rückgabe sind auf der Rückgabe-Seite beschrieben.',
      ],
      damaged: [
        'Was tun bei Beschädigung?',
        'Fotografieren Sie den Schaden bei Erhalt und kontaktieren Sie uns ({phones} / {emails}).',
      ],
      care: 'Pflanzenpflege',
      plantWhen: [
        'Wann am besten pflanzen?',
        'Containerpflanzen können von Frühling bis Herbst gepflanzt werden. Milde Frühjahrs- und Frühherbstzeiten sind ideal.',
      ],
      consult: [
        'Gibt es Beratung?',
        'Ja — kontaktieren Sie uns unter {phones} oder {emails}.',
      ],
    },
  }

  const loc: Exclude<FaqLocale, 'uk'> =
    locale === 'uk' ? 'en' : (locale as Exclude<FaqLocale, 'uk'>)
  const c = copy[loc]

  return [
    {
      title: c.order,
      questions: [
        { question: c.howOrder[0], answer: fill(c.howOrder[1], vars) },
        { question: c.payment[0], answer: c.payment[1] },
        { question: c.invoice[0], answer: fill(c.invoice[1], vars) },
      ],
    },
    {
      title: c.delivery,
      questions: [
        { question: c.where[0], answer: fill(c.where[1], vars) },
        { question: c.cost[0], answer: c.cost[1] },
        { question: c.packing[0], answer: c.packing[1] },
      ],
    },
    {
      title: c.quality,
      questions: [
        { question: c.warranty[0], answer: c.warranty[1] },
        { question: c.damaged[0], answer: fill(c.damaged[1], vars) },
      ],
    },
    {
      title: c.care,
      questions: [
        { question: c.plantWhen[0], answer: c.plantWhen[1] },
        { question: c.consult[0], answer: fill(c.consult[1], vars) },
      ],
    },
  ]
}

export function buildFaqCategories(
  store: StoreContactSettings,
  options: { locale: string; marketRegion: MarketRegion },
): FaqCategory[] {
  const vars: FaqVars = {
    phones: formatPhonesList(store),
    emails: formatEmailsList(store),
    address: formatStoreAddress(store),
  }
  const localeCode = options.locale.trim().toLowerCase().slice(0, 2) as FaqLocale
  if (options.marketRegion === 'ua') {
    return buildUaFaq(vars)
  }
  const euLocale: FaqLocale =
    localeCode === 'sk' ||
    localeCode === 'cs' ||
    localeCode === 'hu' ||
    localeCode === 'de' ||
    localeCode === 'en'
      ? localeCode
      : 'en'
  return buildEuFaq(euLocale, vars)
}
