import { AccountNotificationsContent } from '@/components/account/account-notifications-content'
import { AccountShell } from '@/components/account/account-shell'

export default function AccountNotificationsPage() {
  return (
    <AccountShell
      title="Підписки та сповіщення"
      description="Сповіщення про появу рослин на складі."
    >
      <AccountNotificationsContent />
    </AccountShell>
  )
}
