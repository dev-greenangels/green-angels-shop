'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'

import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { AuthPhoneFlow } from '@/components/auth/auth-phone-flow'
import { BrandLogo } from '@/components/brand-logo'
import { safeAuthRedirect } from '@/lib/auth/redirect'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'


function AuthForm() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectTo = redirectParam
    ? safeAuthRedirect(redirectParam)
    : '/account'

  return (
    <AuthPageLayout
      backHref={redirectTo}
      brandAlt={tc('brand')}
      heroTitle={t('welcomeTitle')}
      heroBody={t('welcomeBody')}
      heroExtra={
        <div className="flex justify-center gap-8 text-sm opacity-80">
          <div>
            <p className="text-2xl font-bold">170+</p>
            <p>сортів рослин</p>
          </div>
          <div>
            <p className="text-2xl font-bold">5000+</p>
            <p>клієнтів</p>
          </div>
          <div>
            <p className="text-2xl font-bold">14</p>
            <p>років досвіду</p>
          </div>
        </div>
      }
      title={t('authTitle')}
      subtitle={t('authSubtitle')}
    >
      <AuthPhoneFlow
        redirectTo={redirectTo}
        onSuccess={(target) => router.push(target)}
      />
    </AuthPageLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-transparent">
          <BrandLogo
            alt="Зелені Янголи"
            className="animate-pulse"
            imgClassName="max-h-10 opacity-60"
          />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  )
}
