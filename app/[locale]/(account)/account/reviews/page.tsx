import { AccountReviewsContent } from '@/components/account/account-reviews-content'
import { AccountShell } from '@/components/account/account-shell'

export default function AccountReviewsPage() {
  return (
    <AccountShell title="Мої відгуки" description="Відгуки, які ви залишили на сайті.">
      <AccountReviewsContent />
    </AccountShell>
  )
}
