'use client'

import { useState } from 'react'
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
 * ADMIN retirement UI — Technical → Legacy recovery only.
 * Does not expose PENDING/SUPERSEDED internals in primary sync UI.
 */
export function FlexiLegacyRetirementPanel() {
  const t = useTranslations('flexiAutoSync')
  const [preflight, setPreflight] = useState<FlexiLegacyJournalPreflight | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const runPreflight = async () => {
    setBusy('preflight')
    setMessage(null)
    try {
      const data = await fetchFlexiLegacyJournalPreflight()
      setPreflight(data)
      setMessage(
        data.safeToRetire
          ? t('legacySafe')
          : `${t('legacyNotSafe')}: ${data.blockers.slice(0, 3).join(' | ')}`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
    } finally {
      setBusy(null)
    }
  }

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

  const runRetire = async () => {
    if (!preflight?.safeToRetire) {
      setMessage(t('legacyNeedPreflight'))
      return
    }
    if (confirmText.trim() !== 'RETIRE_LEGACY_FLEXI_JOURNAL') {
      setMessage(t('legacyConfirmHint'))
      return
    }
    const ok = window.confirm(
      t('legacyRetireConfirm', { count: preflight.total.toLocaleString() }),
    )
    if (!ok) return
    setBusy('retire')
    setMessage(null)
    try {
      const result = await retireFlexiLegacyJournal()
      setMessage(result.message)
      setPreflight(await fetchFlexiLegacyJournalPreflight())
      setConfirmText('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-amber-800 dark:text-amber-300">{t('legacyWarning')}</p>
      <p className="text-sm">
        {t('legacyJournal')}:{' '}
        <span className="font-semibold tabular-nums">
          {preflight ? preflight.total.toLocaleString() : t('legacyRunPreflightFirst')}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => void runPreflight()}>
          {busy === 'preflight' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('legacyCheckRetire')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(busy) || !preflight}
          onClick={() => void runBackup()}
        >
          {busy === 'backup' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('legacyDownloadBackup')}
        </Button>
      </div>

      {preflight ? (
        <div className="rounded-md border p-3 text-xs space-y-2">
          <p
            className={
              preflight.safeToRetire
                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                : 'font-semibold text-destructive'
            }
          >
            {preflight.safeToRetire ? t('legacySafe') : t('legacyNotSafe')}
          </p>
          <p className="text-muted-foreground">
            {t('legacyEvidenceSummary')}:{' '}
            {preflight.byEvidence
              .slice(0, 8)
              .map((e) => `${e.evidence}×${e.count}`)
              .join(', ')}
            {preflight.byEvidence.length > 8 ? '…' : ''}
          </p>
          {preflight.unknownEvidence.length > 0 ? (
            <p className="text-destructive">
              UNKNOWN: {preflight.unknownEvidence.map((u) => u.evidence).join(', ')}
            </p>
          ) : null}
          {preflight.safeToRetire ? (
            <div className="space-y-2 pt-2 border-t">
              <label className="block text-xs text-muted-foreground" htmlFor="legacy-retire-confirm">
                {t('legacyConfirmHint')}
              </label>
              <input
                id="legacy-retire-confirm"
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RETIRE_LEGACY_FLEXI_JOURNAL"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="destructive"
                disabled={Boolean(busy)}
                onClick={() => void runRetire()}
              >
                {busy === 'retire' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('legacyDeleteJournal')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-xs break-words text-muted-foreground">{message}</p> : null}
    </div>
  )
}
