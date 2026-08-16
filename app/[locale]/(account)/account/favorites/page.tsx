import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountShell } from '@/components/account/account-shell'
import { FavoritesPageContent } from '@/components/favorites/favorites-page-content'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountFavoritesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('favoritesTitle')} description={t('favoritesSubtitle')}>
      <FavoritesPageContent />
    </AccountShell>
  )
}
