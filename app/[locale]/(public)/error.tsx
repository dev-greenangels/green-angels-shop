'use client'

import { useEffect } from 'react'

import { Navigation } from '@/components/navigation'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <Navigation />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <ServiceUnavailableNotice onRetry={reset} className="max-w-lg w-full" />
      </main>
    </>
  )
}
