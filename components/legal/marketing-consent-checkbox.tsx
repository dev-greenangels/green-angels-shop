'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { fetchCurrentLegalDocument } from '@/lib/legal/documents-client'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  fallbackLabel: string
  onRevisionId?: (revisionId: string | undefined) => void
  className?: string
}

/** Opt-in marketing checkbox — always unchecked by default at the call site. */
export function MarketingConsentCheckbox({
  id,
  checked,
  onCheckedChange,
  fallbackLabel,
  onRevisionId,
  className,
}: Props) {
  const locale = useLocale()
  const [label, setLabel] = useState(fallbackLabel)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const doc = await fetchCurrentLegalDocument('MARKETING_CONSENT', locale)
      if (cancelled) return
      if (doc?.intro) setLabel(doc.intro)
      onRevisionId?.(doc?.revisionId)
    })()
    return () => {
      cancelled = true
    }
  }, [locale, onRevisionId])

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5 size-4 shrink-0 rounded-[4px] border-2"
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-xs font-normal leading-snug text-muted-foreground"
      >
        {label || fallbackLabel}
      </Label>
    </div>
  )
}
