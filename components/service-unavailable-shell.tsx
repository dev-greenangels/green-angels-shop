import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'

type ServiceUnavailableShellProps = {
  title?: string
  message?: string
}

export async function ServiceUnavailableShell({
  title,
  message,
}: ServiceUnavailableShellProps) {
  const te = await getTranslations('errors')

  return (
    <>
      <Navigation />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <ServiceUnavailableNotice
          title={title ?? te('temporarilyUnavailableTitle')}
          message={message ?? te('catalogUnavailable')}
          className="max-w-lg w-full"
        />
      </main>
    </>
  )
}
