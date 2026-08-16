import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountNotificationsContent } from '@/components/account/account-notifications-content'
import { AccountShell } from '@/components/account/account-shell'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountNotificationsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('notificationsPageTitle')} description={t('notificationsPageSubtitle')}>
      <AccountNotificationsContent />
    </AccountShell>
  )
}
