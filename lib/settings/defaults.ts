import type {
  CartCheckoutSettings,
  CatalogPageSettings,
  HomePageSettings,
  StoreContactSettings,
  StoreFooterVisibility,
} from '@/lib/settings/types'
import {
  DEFAULT_ENABLED_DELIVERY_METHODS,
  DEFAULT_ENABLED_PAYMENT_METHODS,
} from '@/lib/checkout/methods'
import {
  DEFAULT_CATEGORY_GRID_COLUMNS,
  DEFAULT_PRODUCT_GRID_COLUMNS,
} from '@/lib/catalog/grid-columns'
import {
  DEFAULT_CATALOG_FILTERS_VISIBILITY,
  DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY,
} from '@/lib/catalog/filter-visibility'
import {
  DEFAULT_RECENTLY_VIEWED_SETTINGS,
} from '@/lib/settings/recently-viewed'
import { DEFAULT_LOCALIZATION_SETTINGS } from '@/lib/i18n/locales'
import { DEFAULT_NAVIGATION_SETTINGS } from '@/lib/settings/navigation'

export { DEFAULT_LOCALIZATION_SETTINGS, DEFAULT_NAVIGATION_SETTINGS }

export const DEFAULT_FOOTER_VISIBILITY: StoreFooterVisibility = {
  showAddress: true,
  showPhone: true,
  showEmail: false,
  showViber: true,
  showTelegram: true,
  showWhatsApp: true,
  showLink: true,
  showSchedules: false,
}

export const DEFAULT_SOCIAL_LINKS = {
  instagram: { show: false, url: '' },
  facebook: { show: false, url: '' },
  youtube: { show: false, url: '' },
  viberCommunity: { show: false, url: '' },
  telegramCommunity: { show: false, url: '' },
} as const

export const DEFAULT_MAPS_URL = 'https://maps.app.goo.gl/EdhHzZDNvev2pV9H7'

export const DEFAULT_CONTACT_BLOCKS: StoreContactSettings['contactBlocks'] = [
  {
    title: 'Підтримка',
    lines: [
      { type: 'phone', value: '+380 (67) 123-45-67' },
      { type: 'email', value: 'info@zeleni-yanholy.ua' },
    ],
  },
  {
    title: 'Гурт',
    lines: [
      { type: 'phone', value: '+380 (67) 765-43-21' },
      { type: 'email', value: 'opt@zeleni-yanholy.ua' },
    ],
  },
]

export const DEFAULT_STORE_PHONES: StoreContactSettings['phones'] = [
  { label: 'Підтримка', phone: '+380 (67) 123-45-67' },
  { label: 'Гурт', phone: '+380 (67) 765-43-21' },
]

export const DEFAULT_STORE_EMAILS: StoreContactSettings['emails'] = [
  { label: 'Підтримка', email: 'info@zeleni-yanholy.ua' },
  { label: 'Гурт', email: 'opt@zeleni-yanholy.ua' },
]

/** Порожні контакти без підстановки фейкових даних — коли API недоступне */
export const UNAVAILABLE_STORE_SETTINGS: StoreContactSettings = {
  addressLine1: '',
  addressLine2: '',
  mapsUrl: '',
  contactBlocks: [],
  phones: [],
  emails: [],
  schedules: [],
  footer: {
    showAddress: false,
    showPhone: false,
    showEmail: false,
    showViber: false,
    showTelegram: false,
    showWhatsApp: false,
    showLink: false,
    showSchedules: false,
  },
  social: { ...DEFAULT_SOCIAL_LINKS },
}

export const DEFAULT_STORE_SETTINGS: StoreContactSettings = {
  addressLine1: 'Київська обл., м. Вишгород,',
  addressLine2: 'вул. Садова, 15',
  mapsUrl: DEFAULT_MAPS_URL,
  contactBlocks: DEFAULT_CONTACT_BLOCKS,
  phones: DEFAULT_STORE_PHONES,
  emails: DEFAULT_STORE_EMAILS,
  schedules: [
    {
      title: 'Садовий центр',
      entries: [
        { label: 'Пн-Пт', value: '9:00 – 18:00' },
        { label: 'Субота', value: '9:00 – 15:00' },
        { label: 'Неділя', value: 'вихідний' },
      ],
    },
    {
      title: 'Офіс / телефонія',
      entries: [
        { label: 'Пн-Пт', value: '9:00 – 17:00' },
        { label: 'Субота', value: '10:00 – 14:00' },
        { label: 'Неділя', value: 'вихідний' },
      ],
      note: 'У святкові та передсвяткові дні графік може відрізнятися',
    },
  ],
  footer: { ...DEFAULT_FOOTER_VISIBILITY },
  social: { ...DEFAULT_SOCIAL_LINKS },
}

export const DEFAULT_HOME_SETTINGS: HomePageSettings = {
  hero: {
    badge: 'Виробник рослин · відома торгова марка',
    title: 'Розсадник «Зелені Янголи»',
    titleAccent: 'для професіоналів і садівників',
    subtitle:
      'Власне виробництво хвойних, листяних і декоративних рослин. Тисячі задоволених клієнтів по всій Україні — від приватних садів до великих ландшафтних проєктів.',
    primaryCtaLabel: 'Перейти до каталогу',
    primaryCtaHref: '/catalog',
    secondaryCtaLabel: 'Хіти продажів',
    secondaryCtaHref: '/#bestsellers',
    imageUrl: '/images/hero-plants.jpg',
    highlights: [
      { title: 'Власне виробництво', description: 'Вирощуємо на розсаднику, не перепродаємо' },
      { title: '5000+ клієнтів', description: 'Працюємо з роздрібом і гуртом по Україні' },
      { title: 'Доставка Нова Пошта', description: 'Надійне пакування та відправлення' },
    ],
  },
  categories: {
    title: 'Каталог',
    subtitle: 'Понад 500 позицій у каталозі — оберіть напрямок і замовляйте напряму з розсадника',
    limit: 8,
    categorySlugs: [],
  },
  newArrivals: {
    title: 'Новинки',
    subtitle: 'Свіжі надходження з розсадника — позиції, що знову зʼявились у наявності',
    limit: 6,
    productSlugs: [],
  },
  bestsellers: {
    title: 'Популярний вибір',
    subtitle: 'Найпопулярніші позиції, які обирають наші клієнти знову і знову',
    limit: 6,
    productSlugs: [],
  },
  lowStock: {
    title: 'Закінчується',
    subtitle: 'Позиції, які швидко розкуповують — встигніть замовити, поки є на складі',
    limit: 6,
    productSlugs: [],
    stockThreshold: 15,
  },
  whyUs: {
    title: 'Чому обирають Зелені Янголи',
    subtitle:
      'Ми — виробник посадкового матеріалу з багаторічною репутацією. Нам довіряють садівні центри, ландшафтні компанії та приватні клієнти.',
    features: [
      'Власні поля, теплиці та склади',
      'Стабільна якість і сортність',
      'Великий асортимент у наявності',
      'Оптові та роздрібні ціни',
      'Доставка по всій Україні',
      'Відома торгова марка на ринку',
    ],
    stats: [
      { value: '15+', label: 'років на ринку' },
      { value: '500+', label: 'позицій у каталозі' },
      { value: '5000+', label: 'клієнтів' },
      { value: '100%', label: 'власне виробництво' },
    ],
  },
  nurseryGallery: {
    title: 'Наш розсадник',
    subtitle: 'Поля, теплиці, вирощування та пакування — усе під нашим контролем',
    images: [
      { url: '/images/nursery/field.jpg', caption: 'Поля розсадника' },
      { url: '/images/nursery/greenhouse.jpg', caption: 'Теплиці вирощування' },
      { url: '/images/nursery/warehouse.jpg', caption: 'Склад з горщиками' },
      { url: '/images/nursery/packing.jpg', caption: 'Пакування для відправлення' },
    ],
  },
  reviews: {
    title: 'Відгуки клієнтів',
    subtitle: 'Нам довіряють професіонали та садівники з усієї України',
    items: [
      {
        name: 'Олена К.',
        text: 'Чудовий розсадник! Рослини приїхали в ідеальному стані, добре запаковані. Туї та сосни відмінної якості.',
        rating: 5,
      },
      {
        name: 'Андрій М.',
        text: 'Замовляв велике замовлення для ландшафтного проєкту. Якість посадкового матеріалу на висоті, працюємо вже не перший рік.',
        rating: 5,
      },
      {
        name: 'Марія С.',
        text: 'Дуже вдячна за швидку доставку Новою Поштою. Рослини здорові, відповідають опису. Обовʼязково замовлятиму ще.',
        rating: 5,
      },
      {
        name: 'Ігор В.',
        text: 'Купував декоративні чагарники для ділянки. Усе відповідає каталогу, рослини сильні та добре вкорінені.',
        rating: 4,
      },
    ],
  },
}

export const DEFAULT_CATALOG_SETTINGS: CatalogPageSettings = {
  categoryDisplay: 'both',
  productGridColumns: { ...DEFAULT_PRODUCT_GRID_COLUMNS },
  categoryGridColumns: { ...DEFAULT_CATEGORY_GRID_COLUMNS },
  catalogFilters: { ...DEFAULT_CATALOG_FILTERS_VISIBILITY },
  plantsAlphabetFilters: { ...DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY },
}

export { DEFAULT_RECENTLY_VIEWED_SETTINGS } from '@/lib/settings/recently-viewed'

export const DEFAULT_CHECKOUT_BANK_DETAILS: CartCheckoutSettings['bankDetails'] = {
  organizationName: '',
  edrpou: '',
  iban: '',
  bankName: '',
  mfo: '',
  legalAddress: '',
  taxStatus: '',
}

export const DEFAULT_CHECKOUT_NEXT_STEPS: CartCheckoutSettings['nextSteps'] = [
  {
    title: 'Підтвердження',
    description:
      'Найближчим часом ви отримаєте email або SMS з підтвердженням та планованою датою відвантаження.',
  },
  {
    title: 'Обробка та відправка',
    description:
      'Наші спеціалісти підготують ваші рослини до відправки. В день відправки ви отримаєте SMS з ТТН для відстеження посилки.',
  },
  {
    title: 'Отримання',
    description: 'Огляньте рослини при отриманні. Ми гарантуємо якість!',
  },
]

export const DEFAULT_CART_CHECKOUT_SETTINGS: CartCheckoutSettings = {
  showDelivery: true,
  showPackaging: true,
  showTax: true,
  deliveryMode: 'carrier_rates',
  deliveryAmount: 0,
  packagingAmount: 0,
  taxRatePercent: 20,
  taxIncluded: true,
  deliveryFreeForPickup: true,
  minOrderAmount: null,
  belowMinOrderBehavior: 'reject',
  belowMinPackagingFee: 0,
  enabledDeliveryMethods: [...DEFAULT_ENABLED_DELIVERY_METHODS],
  enabledPaymentMethods: [...DEFAULT_ENABLED_PAYMENT_METHODS],
  bankDetails: { ...DEFAULT_CHECKOUT_BANK_DETAILS },
  paymentPurposeTemplate: 'Оплата за замовлення {orderNumber}',
  nextSteps: DEFAULT_CHECKOUT_NEXT_STEPS.map((step) => ({ ...step })),
  gdprConsentText:
    'Я погоджуюся з обробкою персональних даних та умовами використання.',
}
