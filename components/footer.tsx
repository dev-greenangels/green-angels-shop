import { getLocale, getTranslations } from 'next-intl/server'

import { BrandLogo } from '@/components/brand-logo'
import { LanguageSwitcher } from '@/components/localization/language-switcher'
import { SocialLinks } from '@/components/social/social-links'
import { StoreContactsDisplay } from '@/components/store/store-contacts-display'
import { getMarketBranding } from '@/lib/branding/market-branding'
import { fetchCatalogCategories } from '@/lib/catalog/categories'
import { categoryHref, fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { hasHiddenFooterContacts } from '@/lib/settings/store-contact-lines'
import {
  fetchPublicSiteSettings,
  getLocalizationSettings,
  getMarketSettings,
  getStoreSettings,
  getWholesalePageSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { hasStoreContactInfo } from '@/lib/settings/store-helpers'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export async function Footer() {
  const locale = await getLocale()
  const t = await getTranslations('footer')
  const tc = await getTranslations('common')
  const te = await getTranslations('errors')
  const year = new Date().getFullYear()

  const [siteSettings, categoriesResult, catalogRootSlug] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchCatalogCategories(locale),
    fetchCatalogRootSlug(locale),
  ])

  const store = getStoreSettings(siteSettings)
  const localization = getLocalizationSettings(siteSettings)
  const market = getMarketSettings(siteSettings)
  const wholesalePage = getWholesalePageSettings(siteSettings)
  const branding = getMarketBranding(market.region)
  const isSkMarket = market.region === 'sk'
  const storeUnavailable = isStoreContactUnavailable(siteSettings)
  const showContactsUnavailable = storeUnavailable || !hasStoreContactInfo(store)

  const categoryLinks = categoriesResult.data.slice(0, 6).map((category) => ({
    href: categoryHref(category.slug),
    label: category.name,
  }))
  const catalogLink = resolveCatalogHref(catalogRootSlug)

  const linkClassName =
    'block text-base text-primary-foreground/85 transition-colors hover:text-primary-foreground'

  return (
    <footer className="bg-footer-gradient text-primary-foreground">
      <div className={cn(siteContentShellClassName, 'py-14 md:pt-20 md:pb-10')}>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_auto]">
          <div className="flex flex-col items-center space-y-5 text-center md:items-start md:text-left">
            <Link href="/" className="inline-flex justify-center md:justify-start">
              <BrandLogo
                alt={tc('brand')}
                variant="onDark"
                logoSrc={branding.footerLogo}
                imgClassName="max-h-20 max-w-[min(300px,85vw)] md:max-h-[4.5rem] md:max-w-[260px]"
              />
            </Link>
            <p className="max-w-sm text-base leading-relaxed text-primary-foreground/85">{t('intro')}</p>
            <SocialLinks
              social={store.social}
              size="lg"
              iconClassName="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:border-primary-foreground/40 hover:bg-primary-foreground/20"
            />
          </div>

          <div>
            <h3 className="mb-5 font-serif text-xl font-semibold md:text-2xl">{t('catalogTitle')}</h3>
            <nav className="space-y-2.5">
              <Link href={catalogLink} className={linkClassName}>
                {t('catalogTitle')}
              </Link>
              {categoryLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClassName}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="mb-5 font-serif text-xl font-semibold md:text-2xl">{t('infoTitle')}</h3>
            <nav className="space-y-2.5">
              <Link href="/shipping" className={linkClassName}>
                {isSkMarket ? t('shippingSk') : t('shipping')}
              </Link>
              <Link href="/blog" className={linkClassName}>
                {t('blog')}
              </Link>
              <Link href="/about" className={linkClassName}>
                {t('about')}
              </Link>
              {wholesalePage.pageEnabled ? (
                <Link href="/wholesale" className={linkClassName}>
                  {t('wholesale')}
                </Link>
              ) : null}
              <Link href="/contacts" className={linkClassName}>
                {t('contacts')}
              </Link>
              <Link href="/faq" className={linkClassName}>
                {t('faq')}
              </Link>
              <Link href="/terms" className={linkClassName}>
                {isSkMarket ? t('termsSk') : t('terms')}
              </Link>
              <Link href="/privacy" className={linkClassName}>
                {isSkMarket ? t('privacySk') : t('privacy')}
              </Link>
              {isSkMarket ? (
                <Link href="/returns" className={linkClassName}>
                  {t('returnsSk')}
                </Link>
              ) : null}
              <Link href="/cookies" className={linkClassName}>
                {t('cookies')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-5 font-serif text-xl font-semibold md:text-2xl">{t('contactsTitle')}</h3>
            {showContactsUnavailable ? (
              <p className="text-base leading-relaxed text-primary-foreground/85">
                {te('serviceUnavailable')}
              </p>
            ) : (
              <>
                <StoreContactsDisplay
                  store={store}
                  grouped
                  filterByFooterVisibility
                  visibility={store.footer}
                  marketRegion={market.region}
                  socialSectionTitle={t('socialTitle')}
                  iconClassName="text-primary-foreground"
                  textClassName="text-base text-primary-foreground/85"
                  linkClassName="text-base text-primary-foreground/85 hover:text-primary-foreground"
                />
                {hasHiddenFooterContacts(store.footer) ? (
                  <Link
                    href="/contacts"
                    className="mt-3 inline-block text-base text-primary-foreground/85 underline-offset-4 transition-colors hover:text-primary-foreground hover:underline"
                  >
                    {t('fullContacts')}
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/20">
        <div
          className={cn(
            siteContentShellClassName,
            'flex flex-col gap-4 py-6 text-base text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between md:py-8',
          )}
        >
          <p className="text-center sm:text-left">{tc('copyright', { year })}</p>
          {localization.showLanguageSwitcher ? (
            <LanguageSwitcher variant="footer" className="justify-center sm:justify-end" />
          ) : null}
        </div>
      </div>
    </footer>
  )
}
