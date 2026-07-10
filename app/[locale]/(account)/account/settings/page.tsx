import { AccountShell } from '@/components/account/account-shell'
import { AccountSettingsContent } from '@/components/account/account-settings-content'

export default function AccountSettingsPage() {
  return (
    <AccountShell
      title="Налаштування"
      description="Профіль, контакти та адреса доставки за замовчуванням."
    >
      <AccountSettingsContent />
    </AccountShell>
  )
}
