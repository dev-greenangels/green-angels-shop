import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountOrdersContent } from '@/components/account/account-orders-content'
import { AccountShell } from '@/components/account/account-shell'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountOrdersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('ordersTitle')} description={t('ordersSubtitle')}>
      <AccountOrdersContent />
    </AccountShell>
  )
}
