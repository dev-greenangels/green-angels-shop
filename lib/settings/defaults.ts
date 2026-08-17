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
import { HOME_SECTION_KEYS } from '@/lib/settings/home-sections'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/market'

export { DEFAULT_LOCALIZATION_SETTINGS, DEFAULT_NAVIGATION_SETTINGS, DEFAULT_MARKET_SETTINGS }

export const DEFAULT_FOOTER_VISIBILITY: StoreFooterVisibility = {
  showAddress: false,
  showPhone: false,
  showEmail: false,
  showViber: false,
  showTelegram: false,
  showWhatsApp: false,
  showLink: false,
  showSchedules: false,
  showCompanyDetails: false,
}

export const DEFAULT_SOCIAL_LINKS = {
  instagram: { show: false, url: '' },
  facebook: { show: false, url: '' },
  youtube: { show: false, url: '' },
  viberCommunity: { show: false, url: '' },
  telegramCommunity: { show: false, url: '' },
} as const

export const DEFAULT_MAPS_URL = ''

export const DEFAULT_CONTACT_BLOCKS: StoreContactSettings['contactBlocks'] = []

export const DEFAULT_STORE_PHONES: StoreContactSettings['phones'] = []

export const DEFAULT_STORE_EMAILS: StoreContactSettings['emails'] = []

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
    showCompanyDetails: false,
  },
  social: { ...DEFAULT_SOCIAL_LINKS },
  companyDetails: {
    organizationName: '',
    edrpou: '',
    iban: '',
    bankName: '',
    mfo: '',
    legalAddress: '',
    taxStatus: '',
    bic: '',
    dic: '',
    icDph: '',
  },
  showCompanyOnContacts: false,
}

export const DEFAULT_STORE_SETTINGS: StoreContactSettings = {
  addressLine1: '',
  addressLine2: '',
  mapsUrl: DEFAULT_MAPS_URL,
  contactBlocks: DEFAULT_CONTACT_BLOCKS,
  phones: DEFAULT_STORE_PHONES,
  emails: DEFAULT_STORE_EMAILS,
  schedules: [],
  footer: { ...DEFAULT_FOOTER_VISIBILITY },
  social: { ...DEFAULT_SOCIAL_LINKS },
  companyDetails: {
    organizationName: '',
    edrpou: '',
    iban: '',
    bankName: '',
    mfo: '',
    legalAddress: '',
    taxStatus: '',
    bic: '',
    dic: '',
    icDph: '',
  },
  showCompanyOnContacts: false,
}

export const DEFAULT_HOME_SETTINGS: HomePageSettings = {
  sectionOrder: [...HOME_SECTION_KEYS],
  sectionHidden: [],
  hero: {
    badge: 'Виробник рослин',
    title: 'Розсадник «Зелені Янголи»',
    titleAccent: 'для професіоналів і садівників',
    subtitle:
      'Власне виробництво хвойних, листяних і декоративних рослин.',
    primaryCtaLabel: 'Перейти до каталогу',
    primaryCtaHref: '/catalog',
    secondaryCtaLabel: 'Хіти продажів',
    secondaryCtaHref: '/#bestsellers',
    imageUrl: '/images/hero-plants.jpg',
    highlights: [
      { title: 'Власне виробництво', description: 'Вирощуємо на розсаднику, не перепродаємо' },
      { title: 'Якість і сортність', description: 'Стабільний посадковий матеріал' },
      { title: 'Доставка', description: 'Надійне пакування та відправлення' },
    ],
  },
  categories: {
    title: 'Каталог',
    subtitle: 'Оберіть напрямок і замовляйте напряму з розсадника',
    limit: 8,
    categorySlugs: [],
  },
  newArrivals: {
    title: 'Новинки',
    subtitle: 'Свіжі надходження з розсадника',
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
      'Доставка',
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
  freshPlantPhotos: {
    enabled: true,
    title: 'Актуальні фото рослин',
    subtitle: 'Свіжі знімки з розсадника — подивіться, що зараз у наявності',
    limit: 12,
  },
  reviews: {
    enabled: true,
    title: 'Відгуки клієнтів',
    subtitle: 'Нам довіряють професіонали та садівники',
    limit: 8,
    sort: 'newest',
  },
}

export const DEFAULT_CATALOG_SETTINGS: CatalogPageSettings = {
  categoryDisplay: 'both',
  productGridColumns: { ...DEFAULT_PRODUCT_GRID_COLUMNS },
  categoryGridColumns: { ...DEFAULT_CATEGORY_GRID_COLUMNS },
  catalogFilters: { ...DEFAULT_CATALOG_FILTERS_VISIBILITY },
  plantsAlphabetFilters: { ...DEFAULT_PLANTS_ALPHABET_FILTERS_VISIBILITY },
  freshPhotosLimit: 4,
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
  bic: '',
  dic: '',
  icDph: '',
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
  showPromoCode: true,
  deliveryMode: 'carrier_rates',
  deliveryAmount: 0,
  packagingAmount: 0,
  packagingMode: 'flat',
  boxMaxWeightKg: 0,
  boxMaxVolumeL: 0,
  boxUnitPrice: 0,
  boxesPerPallet: 0,
  palletSurcharge: 0,
  taxRatePercent: 20,
  taxIncluded: true,
  taxAppliesToFees: false,
  deliveryFreeForPickup: true,
  minOrderAmount: null,
  belowMinOrderBehavior: 'reject',
  belowMinPackagingFee: 0,
  enabledDeliveryMethods: [...DEFAULT_ENABLED_DELIVERY_METHODS],
  enabledPaymentMethods: [...DEFAULT_ENABLED_PAYMENT_METHODS],
  deliveryWeightRules: [],
  carrierRateTables: {},
  cartWeight: {
    enabled: false,
    useFactKg: true,
    useVolumetricKg: false,
    volumetricDivisor: 5000,
  },
  codFeeAmount: 0,
  codFeeMode: 'fixed',
  onlineCardProvider: 'monopay',
  onlineCardErpExportMode: 'on_paid',
  bankDetailsSource: 'cart',
  bankDetails: { ...DEFAULT_CHECKOUT_BANK_DETAILS },
  paymentPurposeTemplate: 'Оплата за замовлення {orderNumber}',
  nextSteps: DEFAULT_CHECKOUT_NEXT_STEPS.map((step) => ({ ...step })),
  gdprConsentText:
    'Я погоджуюся з обробкою персональних даних та умовами використання.',
  allowShipmentSplit: true,
  orderPdfDownloadEnabled: true,
  orderPdfEmailEnabled: true,
  orderPdfTitle: '',
}
