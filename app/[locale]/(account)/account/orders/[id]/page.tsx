import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountOrderDetailContent } from '@/components/account/account-order-detail-content'
import { AccountShell } from '@/components/account/account-shell'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell
      title={t('orderDetailTitle')}
      description={t('orderDetailSubtitle')}
    >
      <AccountOrderDetailContent orderId={id} />
    </AccountShell>
  )
}
