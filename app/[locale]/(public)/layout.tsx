import { Suspense } from 'react'

import { Footer } from '@/components/footer'

function FooterFallback() {
  return <footer className="bg-primary text-primary-foreground" aria-hidden />
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  )
}
