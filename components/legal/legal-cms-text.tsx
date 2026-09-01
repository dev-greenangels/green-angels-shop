'use client'

import { Fragment, type ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import type { LegalInternalDocKey } from '@/components/legal/legal-internal-link'
import { LEGAL_CMS_INTERNAL_LINK_PATTERN, countLegalCmsInternalLinks } from '@/lib/legal/legal-cms-parse'
import { cn } from '@/lib/utils'

const DOC_HREFS: Record<LegalInternalDocKey, string> = {
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  returns: '/returns',
  shipping: '/shipping',
  contacts: '/contacts',
}

function isLegalDocKey(value: string): value is LegalInternalDocKey {
  return value in DOC_HREFS
}

function renderInternalLink(
  key: string,
  doc: LegalInternalDocKey,
  hash: string | undefined,
  label: string,
) {
  const href = hash ? `${DOC_HREFS[doc]}#${hash}` : DOC_HREFS[doc]
  return (
    <Link
      key={key}
      href={href as '/terms'}
      className="text-primary underline underline-offset-2"
    >
      {label}
    </Link>
  )
}

function parseInlineNodes(text: string, supportEmail: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let linkIndex = 0
  LEGAL_CMS_INTERNAL_LINK_PATTERN.lastIndex = 0

  for (const match of text.matchAll(LEGAL_CMS_INTERNAL_LINK_PATTERN)) {
    const [raw, docRaw, hash, labelRaw] = match
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(
        ...parseEmailNodes(text.slice(lastIndex, index), supportEmail, `pre-${index}`),
      )
    }
    if (docRaw && isLegalDocKey(docRaw)) {
      nodes.push(
        renderInternalLink(
          `cms-link-${linkIndex}`,
          docRaw,
          hash,
          labelRaw?.trim() || docRaw,
        ),
      )
      linkIndex += 1
    } else {
      nodes.push(<Fragment key={`cms-raw-${index}`}>{raw}</Fragment>)
    }
    lastIndex = index + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(...parseEmailNodes(text.slice(lastIndex), supportEmail, `tail-${lastIndex}`))
  }

  return nodes.length ? nodes : [text]
}

function parseEmailNodes(text: string, supportEmail: string, keyPrefix: string): ReactNode[] {
  if (!supportEmail || !text.includes(supportEmail)) {
    return text ? [text] : []
  }

  const parts = text.split(supportEmail)
  const nodes: ReactNode[] = []
  parts.forEach((part, index) => {
    if (part) {
      nodes.push(<Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>)
    }
    if (index < parts.length - 1) {
      nodes.push(
        <a
          key={`${keyPrefix}-email-${index}`}
          href={`mailto:${supportEmail}`}
          className="text-primary underline underline-offset-2"
        >
          {supportEmail}
        </a>,
      )
    }
  })
  return nodes
}

export function LegalCmsText({
  text,
  supportEmail,
  className,
}: {
  text: string
  supportEmail: string
  className?: string
}) {
  const nodes = parseInlineNodes(text, supportEmail)
  const isNavRow = countLegalCmsInternalLinks(text) >= 2

  if (isNavRow) {
    const linkNodes = nodes.filter((node) => typeof node !== 'string')
    return (
      <nav className={cn('flex flex-wrap gap-x-3 gap-y-2 text-sm pt-2', className)}>
        {linkNodes.map((node, index) => (
          <Fragment key={`cms-nav-${index}`}>
            {index > 0 ? (
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
            ) : null}
            {node}
          </Fragment>
        ))}
      </nav>
    )
  }

  return <span className={className}>{nodes}</span>
}
