import { BackstageContentLocaleProvider } from '@/components/backstage/backstage-content-locale'
import { BackstageUiLocaleProvider } from '@/components/backstage/backstage-ui-locale'

export default function BackstagePanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BackstageUiLocaleProvider>
      <BackstageContentLocaleProvider>{children}</BackstageContentLocaleProvider>
    </BackstageUiLocaleProvider>
  )
}

