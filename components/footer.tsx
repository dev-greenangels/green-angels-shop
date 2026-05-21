'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { useSession } from '@/components/providers/session-provider'

export function Footer() {
  const t = useTranslations('footer')
  const tc = useTranslations('common')
  const { user } = useSession()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="flex flex-col items-center space-y-4 text-center md:items-start md:text-left">
            <Link href="/" className="inline-flex justify-center md:justify-start">
              <BrandLogo
                alt={tc('brand')}
                variant="onDark"
                imgClassName="max-h-16 max-w-[min(260px,80vw)] md:max-h-11 md:max-w-[200px]"
              />
            </Link>
            <p className="max-w-sm text-sm text-primary-foreground/80">{t('intro')}</p>
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">{t('catalogTitle')}</h3>
            <nav className="space-y-2">
              <Link
                href="/catalog/conifers"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('conifers')}
              </Link>
              <Link
                href="/catalog/deciduous"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('deciduous')}
              </Link>
              <Link
                href="/catalog/perennials"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('perennials')}
              </Link>
              <Link
                href="/catalog/shrubs"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('shrubs')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">{t('infoTitle')}</h3>
            <nav className="space-y-2">
              <Link
                href="/shipping"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('shipping')}
              </Link>
              <Link
                href="/faq"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('faq')}
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                {t('terms')}
              </Link>
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  {t('admin')}
                </Link>
              )}
            </nav>
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">{t('contactsTitle')}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="text-sm text-primary-foreground/80">
                  {t('addressLine1')}
                  <br />
                  {t('addressLine2')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0" />
                <a
                  href="tel:+380671234567"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  +380 (67) 123-45-67
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href="mailto:info@zeleni-yanholy.ua"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  info@zeleni-yanholy.ua
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="text-sm text-primary-foreground/80">
                  {t('hoursLine1')}
                  <br />
                  {t('hoursLine2')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>{tc('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  )
}
