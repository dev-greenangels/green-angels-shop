import type { RecentlyViewedSettings } from './recently-viewed'
import type { AppLocale, LocalizationSettings } from '@/lib/i18n/locales'
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

/** Per-locale store contact CMS (addresses, block titles, schedules). */
export type StoreContactCmsCopy = {
  addressLine1: string
  addressLine2: string
  contactBlocks: StoreContactBlock[]
  schedules: StoreHoursSchedule[]
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
  /** Locale-specific address / contact titles / opening hours. */
  byLocale: Partial<Record<AppLocale, StoreContactCmsCopy>>
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
import type { HomePageCmsCopy } from '@/lib/settings/home-cms'

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
    mobileImageUrl: string
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
  /** Locale-specific CMS texts (hero labels, section titles, captions, …). */
  byLocale: Partial<Record<AppLocale, HomePageCmsCopy>>
}

export type BelowMinOrderBehavior = 'reject' | 'add_packaging_fee'

export type DeliveryMode = 'free' | 'carrier_rates' | 'fixed'

/** Провайдер онлайн-оплати карткою для методу `card-online`. */
export type OnlineCardProvider = 'monopay' | 'stripe'

export type OnlineCardErpExportMode = 'immediate' | 'on_paid'

/** flat — packagingAmount; boxes — box strategy; pallet — pallet occupancy only. */
export type PackagingMode = 'flat' | 'boxes' | 'pallet'

export type CarrierWeightStrategyKind = 'ACTUAL_WEIGHT' | 'VOLUMETRIC_OR_ACTUAL'

export type CarrierServicePhysicalLimits = {
  maxParcelWeightKg?: number
  maxLongestSideCm?: number
  maxSideSumCm?: number
  maxGirthCm?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  supportsBoxes?: boolean
  supportsPallets?: boolean
  weightStrategy?: CarrierWeightStrategyKind
  volumetricDivisor?: number
}

export type PacketaCodAmountTier = {
  fromAmount: number
  toAmount: number | null
  fee: number
}

/** @deprecated Prefer PacketaCodAmountTier */
export type PacketaCodFeeTier = PacketaCodAmountTier

export type PacketaCustomerCodFeeBase =
  | 'cod_collected'
  | 'products_subtotal'
  | 'grand_total_before_cod'

/** @deprecated Prefer PacketaCustomerCodFeeBase */
export type PacketaCodFeeBase = PacketaCustomerCodFeeBase

export type PacketaCodCarrierCostSettings = {
  enabled: boolean
  basis: 'COD_AMOUNT'
  amountsAreNet: boolean
  tiers: PacketaCodAmountTier[]
}

export type PacketaCardOnCodSettings = {
  enabled: boolean
  percent: number
  basis: 'COD_AMOUNT_INCLUDING_VAT'
  chargedTo: 'SENDER'
  affectsCustomerTotal: false
}

export type PacketaCustomerCodPriceMode = 'none' | 'fixed' | 'tiers'

export type PacketaCustomerCodPriceSettings = {
  mode: PacketaCustomerCodPriceMode
  maxAmount: number | null
  feeBase: PacketaCustomerCodFeeBase
  feeAmountsAreNet: boolean
  fixedAmount: number
  tiers: PacketaCodAmountTier[]
}

export type PacketaCodSettings = {
  carrierCost: PacketaCodCarrierCostSettings
  cardOnCod: PacketaCardOnCodSettings
  customerPrice: PacketaCustomerCodPriceSettings
  byService?: Record<string, PacketaServiceCodCarrierSettings>
}

export type PacketaServiceCodCarrierSettings = {
  supportsCod: boolean
  maxAmount: number | null
  carrierCost: PacketaCodCarrierCostSettings
}

export type CarrierConfig = {
  tariffAmountsAreNet?: boolean
  services?: Partial<Record<string, CarrierServicePhysicalLimits>>
  cod?: PacketaCodSettings
  /** Packeta-only: internal service identity catalog + maps. */
  serviceIdentity?: PacketaServiceIdentitySettings
}

export type PacketaServiceKey = string

export type PacketaServiceDefinition = {
  serviceKey: PacketaServiceKey
  label: string
  customerMethod: 'packeta-box' | 'packeta-courier'
  countryCode: string
  packetaCarrierId?: number
  enabled: boolean
}

export type PacketaServiceIdentitySettings = {
  catalog: PacketaServiceDefinition[]
  courierDefaultServiceByCountry: Record<string, PacketaServiceKey>
  boxDefaultServiceByCountry: Record<
    string,
    Partial<Record<'branch' | 'box', PacketaServiceKey>>
  >
  boxKindDefaultServiceKey: Partial<Record<'branch' | 'box', PacketaServiceKey>>
}

export type CarrierConfigs = {
  packeta?: CarrierConfig
  gls?: CarrierConfig
  novaPoshta?: CarrierConfig
}

export type PackagingPalletSettings = {
  enabled: boolean
  unitPrice: number
  /** VariantAttributeValue.slug on CONTAINER attr — never translated labels. */
  capacityByContainerSlug: Record<string, number>
  autoPricingEnabled: boolean
}

export type PackagingStrategySettings = {
  /** Mirrors packagingMode: flat | box(←boxes) | pallet */
  mode: 'flat' | 'box' | 'pallet'
  pallet: PackagingPalletSettings
}

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
  carrierRateTables?: Record<string, Array<{ maxWeightKg: number; amount: number }>>
  carrierSurcharges?: Record<
    string,
    {
      fuelPercent: number
      fuelMode: 'separate' | 'included' | 'none'
      tollPerStartedKgNet: number
      tollMode: 'separate' | 'included' | 'none'
      maxParcelWeightKg: number
      insurance?: {
        enabled: boolean
        maxDeclaredValue: number | null
        tiers: Array<{ upTo: number; fee: number }>
      }
      nonDepot?: {
        amount: number
        automaticCalculation: false
      }
    }
  >
  standardParcelMaxWeightKg?: number
  /** Shipping-only fallback kg per unit when variant weight missing (default 1). */
  defaultMissingWeightKg?: number
  packagingAmountsAreNet?: boolean
  /** Default true when missing — Packeta contractual tariffs are NET. */
  carrierTariffAmountsAreNet?: boolean
  /** Prefer carrierConfigs.packeta|gls.tariffAmountsAreNet; global kept for one release. */
  carrierConfigs?: CarrierConfigs
  packagingStrategy?: PackagingStrategySettings
  codFeeAmountsAreNet?: boolean
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
  allowPayOnPickup: boolean
  newOrderNotifyEmailEnabled: boolean
  newOrderNotifyEmail: string
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
  dispatchCalendar?: {
    enabled: boolean
    shippingLeadNotice?: {
      enabled: boolean
      showMode: 'when_calendar_off' | 'always' | 'with_calendar'
      texts: Record<string, string>
    }
  }
  /** лише в backstage GET /settings */
  prestaImport?: import('./presta-import').PrestaImportSettings
  /** лише в backstage GET /settings */
  mediaWatermark?: MediaWatermarkSettings
  withdrawal?: import('./withdrawal').WithdrawalPublicSettings
  /** лише в backstage GET /settings */
  withdrawalFull?: import('./withdrawal').WithdrawalSettings
}
