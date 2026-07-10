import { AccountShell } from '@/components/account/account-shell'
import { FavoritesPageContent } from '@/components/favorites/favorites-page-content'

export default function AccountFavoritesPage() {
  return (
    <AccountShell title="Вподобане" description="Збережені рослини для швидкого доступу.">
      <FavoritesPageContent />
    </AccountShell>
  )
}
