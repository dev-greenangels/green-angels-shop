import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { BackstageLoginForm } from '@/components/backstage/backstage-login-form'
import { BackstageLoginHeader } from '@/components/backstage/backstage-login-header'
import { BackstageUiLocaleProvider } from '@/components/backstage/backstage-ui-locale'
import { getBackstageSession } from '@/lib/backstage-auth/get-session'
import { safeBackstageRedirect } from '@/lib/backstage-auth/redirect'

function LoginForm({ redirectTo }: { redirectTo: string }) {
  return <BackstageLoginForm redirectTo={redirectTo} />
}

async function BackstageLoginGate({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const session = await getBackstageSession()
  const params = await searchParams
  const redirectTo = safeBackstageRedirect(params.redirect ?? null)

  if (session) {
    redirect(redirectTo)
  }

  return <LoginForm redirectTo={redirectTo} />
}

export default function BackstageLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  return (
    <BackstageUiLocaleProvider>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-accent p-4">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background/20 p-8 shadow-lg backdrop-blur-md">
          <BackstageLoginHeader />

          <Suspense fallback={null}>
            <BackstageLoginGate searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </BackstageUiLocaleProvider>
  )
}
