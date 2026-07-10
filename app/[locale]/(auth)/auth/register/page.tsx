import { redirect } from '@/i18n/navigation'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

/** Реєстрація об’єднана з входом — перенаправлення на /auth/login */
export default async function RegisterRedirectPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const query = await searchParams
  const redirectParam = query.redirect?.trim()
  const target =
    redirectParam && redirectParam.startsWith('/')
      ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}`
      : '/auth/login'
  redirect({ href: target, locale })
}
