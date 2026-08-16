'use client'

import { useState } from 'react'
import { Download, Loader2, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { deleteAccount, fetchAccountExport } from '@/lib/account/api'

const DELETE_CONFIRMATION_WORD = 'DELETE'

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function AccountPrivacySection() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const [exporting, setExporting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await fetchAccountExport()
      downloadJson(data, `account-data-${new Date().toISOString().slice(0, 10)}.json`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('exportDataFailed'))
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (confirmText.trim() !== DELETE_CONFIRMATION_WORD) return
    setDeleting(true)
    try {
      await deleteAccount(confirmText.trim())
      window.location.href = '/api/auth/logout'
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('deleteAccountFailed'))
      setDeleting(false)
    }
  }

  return (
    <section className="max-w-xl space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-serif text-lg font-semibold">{t('privacyTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('privacySubtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('exportData')}</p>
          <p className="text-xs text-muted-foreground">{t('exportDataHint')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="min-h-11 w-full shrink-0 sm:w-auto"
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('exportData')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <TriangleAlert className="h-4 w-4" />
            {t('deleteAccountTitle')}
          </p>
          <p className="text-xs text-muted-foreground">{t('deleteAccountHint')}</p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setDialogOpen(true)}
          className="min-h-11 w-full shrink-0 sm:w-auto"
        >
          {t('deleteAccountButton')}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t.rich('privacyPolicyNote', {
          privacy: (chunks) => (
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setConfirmText('')
        }}
      >
        <DialogContent className="max-h-[min(90dvh,100%)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteAccountDialogTitle')}</DialogTitle>
            <DialogDescription>{t('deleteAccountDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-account-confirm">
              {t('deleteAccountConfirmLabel', { word: DELETE_CONFIRMATION_WORD })}
            </Label>
            <Input
              id="delete-account-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={DELETE_CONFIRMATION_WORD}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={deleting}>
              {tc('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || confirmText.trim() !== DELETE_CONFIRMATION_WORD}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('deleteAccountConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
