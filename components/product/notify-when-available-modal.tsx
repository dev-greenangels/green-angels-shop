'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { submitAvailabilityNotify } from '@/components/product/submit-availability-notify'
import { notifyAvailabilityButtonClassName } from '@/components/product/notify-availability-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  formatPhoneDisplay,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizeRecipientPhoneInput,
  validateNotifyEmail,
  validateNotifyName,
  validateNotifyPhone,
} from '@/lib/validation/stock-notification-form'

type NotifyWhenAvailableModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: string
  plantName: string
}

export function NotifyWhenAvailableModal({
  open,
  onOpenChange,
  plantId,
  plantName,
}: NotifyWhenAvailableModalProps) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const [name, setName] = useState('')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setContact('')
    setContactType('email')
    setSubmitted(false)
    setSuccessMessage(null)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleContactTypeChange = (next: 'email' | 'phone') => {
    setContactType(next)
    setContact('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const nameError = validateNotifyName(trimmedName)
    if (nameError) {
      setError(nameError)
      return
    }

    const contactError =
      contactType === 'email'
        ? validateNotifyEmail(contact)
        : validateNotifyPhone(contact)
    if (contactError) {
      setError(contactError)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitAvailabilityNotify(
        {
          plantId,
          plantName,
          name: trimmedName,
          contactType,
          contact: contact.trim(),
        },
        {
          submitFailed: t('notifySubmitFailed'),
          success: t('notifySuccess'),
        },
      )
      setSuccessMessage(result.message)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notifySubmitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            {t('notifyTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('notifyDescription', { name: plantName })}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {successMessage ?? t('notifySuccess')}
            </p>
            <Button type="button" className="w-full" onClick={() => handleOpenChange(false)}>
              {tc('close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notify-name">{t('notifyName')}</Label>
              <Input
                id="notify-name"
                value={name}
                onChange={(e) => setName(sanitizeCyrillicName(e.target.value))}
                placeholder={t('notifyNamePlaceholder')}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('notifyContactMethod')}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleContactTypeChange('email')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'email'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tc('email')}
                </button>
                <button
                  type="button"
                  onClick={() => handleContactTypeChange('phone')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'phone'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tc('phone')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-contact">
                {contactType === 'email' ? tc('email') : tc('phone')}
              </Label>
              <Input
                id="notify-contact"
                type={contactType === 'email' ? 'email' : 'tel'}
                inputMode={contactType === 'email' ? 'email' : 'tel'}
                value={contactType === 'phone' ? formatPhoneDisplay(contact) : contact}
                onChange={(e) =>
                  setContact(
                    contactType === 'email'
                      ? sanitizeEmail(e.target.value)
                      : sanitizeRecipientPhoneInput(e.target.value),
                  )
                }
                placeholder={
                  contactType === 'email' ? t('notifyEmailPlaceholder') : t('notifyPhonePlaceholder')
                }
                autoComplete={contactType === 'email' ? 'email' : 'tel'}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              type="submit"
              className={cn('w-full', notifyAvailabilityButtonClassName)}
              disabled={isSubmitting}
            >
              {isSubmitting ? tc('submitting') : t('notifySubscribe')}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
