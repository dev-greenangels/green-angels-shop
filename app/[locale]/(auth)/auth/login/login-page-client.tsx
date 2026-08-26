'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'

import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { AuthPhoneFlow } from '@/components/auth/auth-phone-flow'
import { BrandLogo } from '@/components/brand-logo'
import type { AuthSubtitleKey } from '@/lib/auth/auth-subtitle'

function AuthForm({
  redirectTo,
  subtitleKey,
}: {
  redirectTo: string
  subtitleKey: AuthSubtitleKey
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')

  return (
    <AuthPageLayout
      backHref={redirectTo}
      brandAlt={tc('brand')}
      heroTitle={t('welcomeTitle')}
      heroBody={t('welcomeBody')}
      heroExtra={
        <div className="flex justify-center gap-8 text-sm opacity-80">
          <div>
            <p className="text-2xl font-bold">{t('heroStats.varietiesValue')}</p>
            <p>{t('heroStats.varietiesLabel')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{t('heroStats.clientsValue')}</p>
            <p>{t('heroStats.clientsLabel')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{t('heroStats.experienceValue')}</p>
            <p>{t('heroStats.experienceLabel')}</p>
          </div>
        </div>
      }
      title={t('authTitle')}
      subtitle={t(subtitleKey)}
    >
      <AuthPhoneFlow redirectTo={redirectTo} onSuccess={() => {}} />
    </AuthPageLayout>
  )
}

export function LoginPageClient({
  redirectTo,
  subtitleKey,
}: {
  redirectTo: string
  subtitleKey: AuthSubtitleKey
}) {
  const tc = useTranslations('common')

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-transparent">
          <BrandLogo
            alt={tc('brand')}
            className="animate-pulse"
            imgClassName="max-h-10 opacity-60"
          />
        </div>
      }
    >
      <AuthForm redirectTo={redirectTo} subtitleKey={subtitleKey} />
    </Suspense>
  )
}
