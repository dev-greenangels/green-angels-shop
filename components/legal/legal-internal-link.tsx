import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export type LegalInternalDocKey =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'returns'
  | 'shipping'
  | 'contacts'

const HREFS: Record<LegalInternalDocKey, string> = {
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  returns: '/returns',
  shipping: '/shipping',
  contacts: '/contacts',
}

type LegalInternalLinkProps = {
  doc: LegalInternalDocKey
  className?: string
  hash?: string
  children?: React.ReactNode
}

export function LegalInternalLink({ doc, className, hash, children }: LegalInternalLinkProps) {
  const t = useTranslations('legalPages')
  const href = hash ? `${HREFS[doc]}#${hash}` : HREFS[doc]
  const label = children ?? t(`${doc}Link`)

  return (
    <Link href={href as '/terms'} className={cn('text-primary underline underline-offset-2', className)}>
      {label}
    </Link>
  )
}
