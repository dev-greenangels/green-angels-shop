import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AccountShell } from '@/components/account/account-shell'
import { AccountSettingsContent } from '@/components/account/account-settings-content'
import { AccountPrivacySection } from '@/components/account/account-privacy-section'

type Props = { params: Promise<{ locale: string }> }

export default async function AccountSettingsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <AccountShell title={t('settingsTitle')} description={t('settingsSubtitle')}>
      <div className="space-y-10">
        <AccountSettingsContent />
        <AccountPrivacySection />
      </div>
    </AccountShell>
  )
}
