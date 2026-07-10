export type TranslationArea = 'storefront' | 'backstage'

export type TranslationSection = {
  id: string
  area: TranslationArea
  label: string
  description: string
  /** Top-level namespace or `backstage.nav` style prefix */
  namespaces: string[]
}

export const NAMESPACE_LABELS: Record<string, string> = {
  metadata: 'SEO та метадані',
  common: 'Кнопки та загальне',
  nav: 'Меню сайту',
  footer: 'Футер',
  auth: 'Вхід та реєстрація',
  account: 'Особистий кабінет',
  catalog: 'Каталог',
  cart: 'Кошик',
  home: 'Головна сторінка',
  errors: 'Помилки',
  filter: 'Фільтри',
  search: 'Пошук',
  favorites: 'Обране',
  recentlyViewed: 'Останні переглянуті',
  promo: 'Промокоди',
  checkout: 'Оформлення замовлення',
  product: 'Сторінка товару',
  reviews: 'Відгуки',
  'backstage.nav': 'Меню бек-офісу',
  'backstage.common': 'Кнопки та дії бек-офісу',
  'backstage.breadcrumbs': 'Хлібні крихти',
  'backstage.contentBanner': 'Банер мови контенту',
}

export const TRANSLATION_SECTIONS: TranslationSection[] = [
  {
    id: 'storefront-nav',
    area: 'storefront',
    label: 'Меню та навігація',
    description: 'Пункти меню, футер, посилання в шапці та підвалі сайту.',
    namespaces: ['nav', 'footer'],
  },
  {
    id: 'storefront-actions',
    area: 'storefront',
    label: 'Кнопки та загальні дії',
    description: 'Підписи кнопок, статуси завантаження, загальні підказки.',
    namespaces: ['common'],
  },
  {
    id: 'storefront-auth',
    area: 'storefront',
    label: 'Авторизація',
    description: 'Вхід, SMS, email, Google.',
    namespaces: ['auth'],
  },
  {
    id: 'storefront-account',
    area: 'storefront',
    label: 'Особистий кабінет',
    description: 'Профіль, замовлення, сповіщення.',
    namespaces: ['account'],
  },
  {
    id: 'storefront-catalog',
    area: 'storefront',
    label: 'Каталог',
    description: 'Список товарів, фільтри, пошук, пагінація.',
    namespaces: ['catalog', 'filter', 'search'],
  },
  {
    id: 'storefront-product',
    area: 'storefront',
    label: 'Товар',
    description: 'Картка товару, розміри, наявність, галерея.',
    namespaces: ['product'],
  },
  {
    id: 'storefront-cart',
    area: 'storefront',
    label: 'Кошик та оформлення',
    description: 'Кошик, checkout, промокоди.',
    namespaces: ['cart', 'checkout', 'promo'],
  },
  {
    id: 'storefront-home',
    area: 'storefront',
    label: 'Головна сторінка',
    description: 'Блоки новинок, категорій, відгуків на головній.',
    namespaces: ['home'],
  },
  {
    id: 'storefront-reviews',
    area: 'storefront',
    label: 'Відгуки',
    description: 'Сторінка відгуків, форма, фільтри.',
    namespaces: ['reviews'],
  },
  {
    id: 'storefront-favorites',
    area: 'storefront',
    label: 'Обране',
    description: 'Список обраних товарів.',
    namespaces: ['favorites'],
  },
  {
    id: 'storefront-recently-viewed',
    area: 'storefront',
    label: 'Останні переглянуті',
    description: 'Підзаголовок, лічильник товарів і підписи кнопок прокрутки в блоці на сайті.',
    namespaces: ['recentlyViewed'],
  },
  {
    id: 'storefront-meta',
    area: 'storefront',
    label: 'SEO та помилки',
    description: 'Title/description сторінок, повідомлення про помилки.',
    namespaces: ['metadata', 'errors'],
  },
  {
    id: 'backstage-nav',
    area: 'backstage',
    label: 'Меню бек-офісу',
    description: 'Пункти бокового меню та розділів панелі.',
    namespaces: ['backstage.nav'],
  },
  {
    id: 'backstage-actions',
    area: 'backstage',
    label: 'Кнопки та дії',
    description: 'Зберегти, скасувати, вийти, пошук у формах.',
    namespaces: ['backstage.common'],
  },
  {
    id: 'backstage-breadcrumbs',
    area: 'backstage',
    label: 'Хлібні крихти',
    description: 'Підписи в навігаційному ланцюжку зверху панелі.',
    namespaces: ['backstage.breadcrumbs'],
  },
  {
    id: 'backstage-content-banner',
    area: 'backstage',
    label: 'Банер мови контенту',
    description: 'Підказка при редагуванні перекладів категорій і товарів.',
    namespaces: ['backstage.contentBanner'],
  },
]

export function namespaceForKey(key: string): string {
  if (key.startsWith('backstage.')) {
    const parts = key.split('.')
    return parts.length >= 3 ? `${parts[0]}.${parts[1]}` : key
  }
  return key.split('.')[0] ?? key
}

export function sectionForKey(key: string): TranslationSection | undefined {
  const ns = namespaceForKey(key)
  return TRANSLATION_SECTIONS.find((section) => section.namespaces.includes(ns))
}
