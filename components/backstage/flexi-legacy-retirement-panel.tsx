'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  downloadFlexiLegacyJournalBackup,
  fetchFlexiLegacyJournalPreflight,
  retireFlexiLegacyJournal,
  type FlexiLegacyJournalPreflight,
} from '@/lib/backstage/flexi'

/**
 * ADMIN — Technical → Legacy recovery.
 * Permanently deletes abandoned FlexiChangeEvent rows. No Full Refresh / reconcile.
 */
export function FlexiLegacyRetirementPanel() {
  const t = useTranslations('flexiAutoSync')
  const [stats, setStats] = useState<FlexiLegacyJournalPreflight | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [cleared, setCleared] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchFlexiLegacyJournalPreflight()
    setStats(data)
    if (data.total === 0) setCleared(true)
  }, [])

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : t('error'))
    })
  }, [load, t])

  const runBackup = async () => {
    setBusy('backup')
    setMessage(null)
    try {
      await downloadFlexiLegacyJournalBackup()
      setMessage(t('legacyBackupDone'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
    } finally {
      setBusy(null)
    }
  }

  const runDelete = async () => {
    if (confirmText.trim() !== 'DELETE_LEGACY_FLEXI_JOURNAL') {
      setMessage(t('legacyConfirmHint'))
      return
    }
    const count = stats?.total ?? 0
    if (!window.confirm(t('legacyDeleteConfirm', { count: count.toLocaleString() }))) return

    setBusy('delete')
    setMessage(null)
    try {
      const result = await retireFlexiLegacyJournal()
      setMessage(result.message)
      await load()
      setConfirmText('')
      if (result.ok && result.remainingCount === 0) setCleared(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
      try {
        await load()
      } catch {
        // ignore
      }
    } finally {
      setBusy(null)
    }
  }

  const total = stats?.total

  return (
    <div className="space-y-3">
      <p className="text-xs text-amber-800 dark:text-amber-300">{t('legacyWarning')}</p>
      <p className="text-sm">
        {t('legacyJournal')}:{' '}
        <span className="font-semibold tabular-nums">
          {total == null ? '…' : total.toLocaleString()}
        </span>
      </p>

      {cleared && total === 0 ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs space-y-1">
          <p className="font-medium text-foreground">{t('legacyClearedTitle')}</p>
          <p className="text-muted-foreground">{t('legacyClearedHint')}</p>
          <p className="text-muted-foreground">{t('legacyClearedOrdersHint')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy) || total === 0}
              onClick={() => void runBackup()}
            >
              {busy === 'backup' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('legacyDownloadBackup')}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <label className="block text-xs text-muted-foreground" htmlFor="legacy-delete-confirm">
              {t('legacyConfirmHint')}
            </label>
            <input
              id="legacy-delete-confirm"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE_LEGACY_FLEXI_JOURNAL"
              autoComplete="off"
              disabled={Boolean(busy) || total === 0}
            />
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(busy) || total === 0}
              onClick={() => void runDelete()}
            >
              {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('legacyDeleteJournal')}
            </Button>
          </div>

          {stats && stats.byEvidence.length > 0 ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">{t('legacyEvidenceSummary')}</summary>
              <p className="mt-1 break-words">
                {stats.byEvidence
                  .slice(0, 12)
                  .map((e) => `${e.evidence}×${e.count}`)
                  .join(', ')}
                {stats.byEvidence.length > 12 ? '…' : ''}
              </p>
            </details>
          ) : null}
        </>
      )}

      {message ? <p className="text-xs break-words text-muted-foreground">{message}</p> : null}
    </div>
  )
}
