import type { MarketRegion } from '@/lib/settings/market'

export type MarketBranding = {
  applicationName: string
  headerLogo: string
  footerLogo: string
  favicon: string
  icon: string
  appleIcon: string
  manifest: string
  socialImage: string
}

const MARKET_BRANDING: Record<MarketRegion, MarketBranding> = {
  ua: {
    applicationName: 'Зелені Янголи',
    headerLogo: '/images/logo.png?v=4',
    footerLogo: '/branding/ua/logo-footer.png?v=4',
    favicon: '/branding/ua/favicon.ico?v=3',
    icon: '/branding/ua/icon-512.png?v=3',
    appleIcon: '/branding/ua/apple-icon.png?v=3',
    manifest: '/branding/ua/manifest.webmanifest',
    socialImage: '/branding/ua/social-share.jpg?v=3',
  },
  sk: {
    applicationName: 'Green Angels International',
    headerLogo: '/branding/sk/logo-header.png?v=4',
    footerLogo: '/branding/sk/logo-footer.png?v=4',
    favicon: '/branding/sk/favicon.ico?v=3',
    icon: '/branding/sk/icon-512.png?v=3',
    appleIcon: '/branding/sk/apple-icon.png?v=3',
    manifest: '/branding/sk/manifest.webmanifest',
    socialImage: '/branding/sk/social-share.jpg?v=3',
  },
}

export function getMarketBranding(region: MarketRegion): MarketBranding {
  return MARKET_BRANDING[region]
}
