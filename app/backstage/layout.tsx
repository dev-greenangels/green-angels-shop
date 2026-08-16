import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Бек-офіс · Зелені Янголи',
  robots: { index: false, follow: false },
}

export default function BackstageRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="contents" data-backstage-root>
      {children}
    </div>
  )
}
