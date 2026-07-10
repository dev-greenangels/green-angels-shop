import { Suspense } from 'react'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

function FooterFallback() {
  return <footer className="bg-primary text-primary-foreground" aria-hidden />
}

export default function AccountSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  )
}
