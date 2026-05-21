'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'

import { submitAvailabilityNotify } from '@/components/product/submit-availability-notify'
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
  const [name, setName] = useState('')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setContact('')
    setContactType('email')
    setSubmitted(false)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const trimmedContact = contact.trim()

    if (!trimmedName) {
      setError('Вкажіть ваше ім’я.')
      return
    }
    if (!trimmedContact) {
      setError(contactType === 'email' ? 'Вкажіть email.' : 'Вкажіть номер телефону.')
      return
    }

    setIsSubmitting(true)
    try {
      await submitAvailabilityNotify({
        plantId,
        plantName,
        name: trimmedName,
        contactType,
        contact: trimmedContact,
      })
      setSubmitted(true)
    } catch {
      setError('Не вдалося надіслати. Спробуйте пізніше.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Повідомити про наявність
          </DialogTitle>
          <DialogDescription>
            Залиште контакт — надішлемо повідомлення, коли з’явиться{' '}
            <span className="font-medium text-foreground">{plantName}</span>.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Дякуємо! Заявку збережено. Коли товар з’явиться на складі, ми повідомимо вас
              автоматично.
            </p>
            <Button type="button" className="w-full" onClick={() => handleOpenChange(false)}>
              Закрити
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notify-name">Ім’я</Label>
              <Input
                id="notify-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше ім’я"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label>Як зв’язатися</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContactType('email')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'email'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setContactType('phone')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'phone'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  Телефон
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-contact">
                {contactType === 'email' ? 'Email' : 'Телефон'}
              </Label>
              <Input
                id="notify-contact"
                type={contactType === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={contactType === 'email' ? 'ваш@email.com' : '+380…'}
                autoComplete={contactType === 'email' ? 'email' : 'tel'}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Надсилання…' : 'Підписатися на сповіщення'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
