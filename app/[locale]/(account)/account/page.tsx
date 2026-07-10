import { AccountDashboardContent } from '@/components/account/account-dashboard-content'
import { AccountShell } from '@/components/account/account-shell'

export default function AccountPage() {
  return (
    <AccountShell
      title="Особистий кабінет"
      description="Огляд замовлень, обраного та сповіщень."
    >
      <AccountDashboardContent />
    </AccountShell>
  )
}
