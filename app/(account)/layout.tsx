import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function AccountSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
