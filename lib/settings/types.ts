import type { RecentlyViewedSettings } from './recently-viewed'
import type { LocalizationSettings } from '@/lib/i18n/locales'
import type { NavigationSettings } from '@/lib/settings/navigation'

export type { LocalizationSettings }

export type StorePhoneContact = {
  label: string
  phone: string
}

export type StoreEmailContact = {
  label: string
  email: string
}

export type StoreContactLineType =
  | 'phone'
  | 'email'
  | 'viber'
  | 'telegram'
  | 'whatsapp'
  | 'link'

export type StoreContactLine = {
  type: StoreContactLineType
  /** Короткий підпис рядка (необовʼязково), напр. «Чат» */
  label?: string
  value: string
}

export type StoreContactBlock = {
  title: string
  lines: StoreContactLine[]
}

export type StoreHoursEntry = {
  label: string
  value: string
}

export type StoreHoursSchedule = {
  title: string
  entries: StoreHoursEntry[]
  note?: string
}

export type StoreFooterVisibility = {
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showViber: boolean
  showTelegram: boolean
  showWhatsApp: boolean
  showLink: boolean
  showSchedules: boolean
}

export type StoreSocialLink = {
  show: boolean
  url: string
}

export type StoreSocialLinks = {
  instagram: StoreSocialLink
  facebook: StoreSocialLink
  youtube: StoreSocialLink
  viberCommunity: StoreSocialLink
  telegramCommunity: StoreSocialLink
}

export type StoreContactSettings = {
  addressLine1: string
  addressLine2: string
  mapsUrl: string
  mapsEmbedUrl?: string
  contactBlocks: StoreContactBlock[]
  /** Похідні з contactBlocks — для сумісності */
  phones: StorePhoneContact[]
  emails: StoreEmailContact[]
  schedules: StoreHoursSchedule[]
  footer: StoreFooterVisibility
  social: StoreSocialLinks
}

export type HomeHighlight = {
  title: string
  description: string
}

export type HomeStat = {
  value: string
  label: string
}

export type HomeGalleryImage = {
  url: string
  caption: string
}

export type HomeReview = {
  name: string
  text: string
  rating: number
}

export type HomePageSettings = {
  hero: {
    badge: string
    title: string
    titleAccent: string
    subtitle: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    imageUrl: string
    highlights: HomeHighlight[]
  }
  categories: {
    title: string
    subtitle: string
    limit: number
    categorySlugs: string[]
  }
  newArrivals: {
    title: string
    subtitle: string
    limit: number
    productSlugs: string[]
  }
  bestsellers: {
    title: string
    subtitle: string
    limit: number
    productSlugs: string[]
  }
  lowStock: {
    title: string
    subtitle: string
    limit: number
    productSlugs: string[]
    stockThreshold: number
  }
  whyUs: {
    title: string
    subtitle: string
    features: string[]
    stats: HomeStat[]
  }
  nurseryGallery: {
    title: string
    subtitle: string
    images: HomeGalleryImage[]
  }
  reviews: {
    title: string
    subtitle: string
    items: HomeReview[]
  }
}

export type BelowMinOrderBehavior = 'reject' | 'add_packaging_fee'

export type DeliveryMode = 'free' | 'carrier_rates' | 'fixed'

export type CheckoutBankDetails = {
  organizationName: string
  edrpou: string
  iban: string
  bankName: string
  mfo: string
  legalAddress: string
  taxStatus: string
}

export type CheckoutNextStepItem = {
  title: string
  description: string
}

export type CartCheckoutSettings = {
  showDelivery: boolean
  showPackaging: boolean
  showTax: boolean
  deliveryMode: DeliveryMode
  deliveryAmount: number
  packagingAmount: number
  taxRatePercent: number
  taxIncluded: boolean
  deliveryFreeForPickup: boolean
  minOrderAmount: number | null
  belowMinOrderBehavior: BelowMinOrderBehavior
  belowMinPackagingFee: number
  enabledDeliveryMethods: import('@/lib/checkout/methods').CheckoutDeliveryMethodSlug[]
  enabledPaymentMethods: import('@/lib/checkout/methods').CheckoutPaymentMethodSlug[]
  bankDetails: CheckoutBankDetails
  paymentPurposeTemplate: string
  nextSteps: CheckoutNextStepItem[]
  gdprConsentText: string
}

export type CatalogCategoryDisplay = 'subcategories' | 'products' | 'both'

export type CatalogGridColumns = {
  mobile: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export type CatalogPageSettings = {
  categoryDisplay: CatalogCategoryDisplay
  productGridColumns: CatalogGridColumns
  categoryGridColumns: CatalogGridColumns
  catalogFilters: import('@/lib/catalog/filter-visibility').CatalogFiltersVisibilitySettings
  plantsAlphabetFilters: import('@/lib/catalog/filter-visibility').CatalogFiltersVisibilitySettings
}

export type {
  RecentlyViewedPageKey,
  RecentlyViewedPageVisibility,
  RecentlyViewedSettings,
} from './recently-viewed'

export type {
  NavigationMenuItem,
  NavigationMenuItemLabels,
  NavigationSettings,
} from './navigation'

export type PublicSiteSettings = {
  store: StoreContactSettings
  home: HomePageSettings
  cart: CartCheckoutSettings
  catalog: CatalogPageSettings
  recentlyViewed: RecentlyViewedSettings
  localization: LocalizationSettings
  navigation: NavigationSettings
}
