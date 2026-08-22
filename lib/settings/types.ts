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
  showCompanyDetails: boolean
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

export type CheckoutBankDetails = {
  organizationName: string
  edrpou: string
  iban: string
  bankName: string
  mfo: string
  legalAddress: string
  taxStatus: string
  bic: string
  dic: string
  icDph: string
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
  companyDetails: CheckoutBankDetails
  showCompanyOnContacts: boolean
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

import type { HomeSectionKey } from '@/lib/settings/home-sections'
import type { ReviewSortOrder } from '@/lib/reviews/types'

export type HomePageSettings = {
  sectionOrder: HomeSectionKey[]
  sectionHidden: HomeSectionKey[]
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
  freshPlantPhotos: {
    enabled: boolean
    title: string
    subtitle: string
    limit: number
  }
  reviews: {
    enabled: boolean
    title: string
    subtitle: string
    limit: number
    sort: ReviewSortOrder
  }
}

export type BelowMinOrderBehavior = 'reject' | 'add_packaging_fee'

export type DeliveryMode = 'free' | 'carrier_rates' | 'fixed'

/** Провайдер онлайн-оплати карткою для методу `card-online`. */
export type OnlineCardProvider = 'monopay' | 'stripe'

export type OnlineCardErpExportMode = 'immediate' | 'on_paid'

export type PackagingMode = 'flat' | 'boxes'

export type CheckoutNextStepItem = {
  title: string
  description: string
}

export type CartCheckoutSettings = {
  showDelivery: boolean
  showPackaging: boolean
  showTax: boolean
  showPromoCode: boolean
  deliveryMode: DeliveryMode
  deliveryAmount: number
  packagingAmount: number
  packagingMode: PackagingMode
  boxMaxWeightKg: number
  boxMaxVolumeL: number
  boxUnitPrice: number
  boxesPerPallet: number
  palletSurcharge: number
  taxRatePercent: number
  taxIncluded: boolean
  /** DPH also on delivery + packaging (forced on for SK region in Nest) */
  taxAppliesToFees?: boolean
  deliveryFreeForPickup: boolean
  minOrderAmount: number | null
  belowMinOrderBehavior: BelowMinOrderBehavior
  belowMinPackagingFee: number
  wholesalerMinOrderAmount: number | null
  wholesalerBelowMinOrderBehavior: BelowMinOrderBehavior
  wholesalerBelowMinPackagingFee: number
  enabledDeliveryMethods: import('@/lib/checkout/methods').CheckoutDeliveryMethodSlug[]
  enabledPaymentMethods: import('@/lib/checkout/methods').CheckoutPaymentMethodSlug[]
  deliveryWeightRules: Array<{
    maxWeightKg: number
    allowedMethods: import('@/lib/checkout/methods').CheckoutDeliveryMethodSlug[]
  }>
  carrierRateTables?: Partial<
    Record<
      import('@/lib/checkout/methods').CheckoutDeliveryMethodSlug,
      Array<{ maxWeightKg: number; amount: number }>
    >
  >
  cartWeight: {
    enabled: boolean
    useFactKg: boolean
    useVolumetricKg: boolean
    volumetricDivisor: number
  }
  /** Макс. довжина / сума сторін / girth по перевізнику (см; 0 = не перевіряти) */
  cartSize: {
    enabled: boolean
    limits: Array<{
      method: import('@/lib/checkout/methods').CheckoutDeliveryMethodSlug
      maxLongestSideCm: number
      maxSideSumCm: number
      maxGirthCm: number
    }>
  }
  codFeeAmount: number
  codFeeMode: 'fixed' | 'percent'
  onlineCardProvider: OnlineCardProvider
  onlineCardErpExportMode: OnlineCardErpExportMode
  bankDetailsSource: 'cart' | 'store'
  bankDetails: CheckoutBankDetails
  paymentPurposeTemplate: string
  nextSteps: CheckoutNextStepItem[]
  gdprConsentText: string
  allowShipmentSplit: boolean
  orderPdfDownloadEnabled: boolean
  orderPdfEmailEnabled: boolean
  orderPdfTitle: string
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
  /** Max Fresh Photos per variant size (`sizeId`). Default 4. */
  freshPhotosLimit: number
}

export type MediaWatermarkSettings = {
  productPhotosEnabled: boolean
  freshPhotosEnabled: boolean
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

export type { WholesalePageSettings } from './wholesale'

export type { AboutPageSettings } from './about'

export type {
  CountrySiteCode,
  CountrySiteCurrency,
  CountrySiteProfile,
  GuestCheckoutMode,
  MarketRegion,
  MarketSettings,
  OtpPurpose,
  PhonePolicy,
} from './market'

export type PublicSiteSettings = {
  store: StoreContactSettings
  home: HomePageSettings
  cart: CartCheckoutSettings
  catalog: CatalogPageSettings
  recentlyViewed: RecentlyViewedSettings
  localization: LocalizationSettings
  navigation: NavigationSettings
  market: import('./market').MarketSettings
  wholesale?: import('./wholesale').WholesalePageSettings
  about?: import('./about').AboutPageSettings
  dispatchCalendar?: { enabled: boolean }
  /** лише в backstage GET /settings */
  prestaImport?: import('./presta-import').PrestaImportSettings
  /** лише в backstage GET /settings */
  mediaWatermark?: MediaWatermarkSettings
}
