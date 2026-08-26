'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchCurrentLegalDocument } from '@/lib/legal/documents-client'

type Props = {
  className?: string
}

export function NewsletterSignupForm({ className }: Props) {
  const t = useTranslations('marketingConsent')
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [label, setLabel] = useState('')
  const [revisionId, setRevisionId] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const doc = await fetchCurrentLegalDocument('MARKETING_CONSENT', locale)
      if (cancelled || !doc) return
      setLabel(doc.intro || doc.title)
      setRevisionId(doc.revisionId)
    })()
    return () => {
      cancelled = true
    }
  }, [locale])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      toast.error(t('emailRequired'))
      return
    }
    if (!consent) {
      toast.error(t('consentRequired'))
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/legal/consents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'MARKETING',
          action: 'GRANTED',
          locale,
          source: 'CONTACT_NEWSLETTER',
          revisionId,
          email: email.trim(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { recorded?: boolean }
      if (!res.ok || data.recorded === false) {
        toast.error(t('signupError'))
        return
      }
      toast.success(t('signupSuccess'))
      setEmail('')
      setConsent(false)
    } catch {
      toast.error(t('signupError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={className}>
      <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">{t('formTitle')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('formSubtitle')}</p>
      <div className="space-y-3">
        <div>
          <Label htmlFor="newsletter-email">{t('emailLabel')}</Label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder={t('emailPlaceholder')}
          />
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="newsletter-consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5 size-4 shrink-0 rounded-[4px] border-2"
          />
          <Label
            htmlFor="newsletter-consent"
            className="cursor-pointer text-xs font-normal leading-snug text-muted-foreground"
          >
            {label || t('checkboxFallback')}
          </Label>
        </div>
        <Button type="submit" disabled={submitting || !consent}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </div>
    </form>
  )
}
