import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountClaimOrderContent } from '@/components/account/account-claim-order-content'
import { AccountPageLoading } from '@/components/account/account-page-state'
import { AccountShell } from '@/components/account/account-shell'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountClaimOrderPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('claimOrderTitle')} description={t('claimOrderSubtitle')}>
      <Suspense fallback={<AccountPageLoading />}>
        <AccountClaimOrderContent />
      </Suspense>
    </AccountShell>
  )
}
