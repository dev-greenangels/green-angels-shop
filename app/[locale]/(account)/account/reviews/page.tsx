import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountReviewsContent } from '@/components/account/account-reviews-content'
import { AccountShell } from '@/components/account/account-shell'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountReviewsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('reviewsTitle')} description={t('reviewsSubtitle')}>
      <AccountReviewsContent />
    </AccountShell>
  )
}
