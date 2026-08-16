import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountReferralsContent } from '@/components/account/account-referrals-content'
import { AccountShell } from '@/components/account/account-shell'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountReferralsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('referralsTitle')} description={t('referralsSubtitle')}>
      <AccountReferralsContent />
    </AccountShell>
  )
}
