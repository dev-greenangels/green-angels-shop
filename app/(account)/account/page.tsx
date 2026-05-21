import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { getSession } from '@/lib/auth/get-session'

export default async function AccountPage() {
  const t = await getTranslations('account')
  const session = await getSession()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      {session && (
        <p className="mt-6 text-sm text-muted-foreground">
          {session.email} · {session.role === 'admin' ? 'admin' : 'customer'}
        </p>
      )}
      <div className="mt-10">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          ← На головну
        </Link>
      </div>
    </div>
  )
}
