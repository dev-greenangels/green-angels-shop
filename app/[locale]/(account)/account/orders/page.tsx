import { AccountOrdersContent } from '@/components/account/account-orders-content'
import { AccountShell } from '@/components/account/account-shell'

export default function AccountOrdersPage() {
  return (
    <AccountShell title="Мої замовлення" description="Історія та статус ваших замовлень.">
      <AccountOrdersContent />
    </AccountShell>
  )
}
