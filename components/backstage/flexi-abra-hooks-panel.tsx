'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  deleteAllFlexiRemoteHooks,
  deleteFlexiOrphanHooks,
  deleteFlexiRemoteHook,
  fetchFlexiRemoteHooks,
  type FlexiRemoteHook,
} from '@/lib/backstage/flexi'
import { cn } from '@/lib/utils'

/**
 * Technical → Hooks у ABRA — manual remote hook management only.
 * Does not touch journal, Full Refresh, or Auto Sync flags.
 */
export function FlexiAbraHooksPanel({
  configuredWebhookUrl,
  onChanged,
}: {
  configuredWebhookUrl: string
  onChanged?: () => void
}) {
  const t = useTranslations('flexiAutoSync')
  const [hooks, setHooks] = useState<FlexiRemoteHook[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState('')
  const [confirmOrphans, setConfirmOrphans] = useState('')

  const load = useCallback(async () => {
    const data = await fetchFlexiRemoteHooks()
    setHooks(data.hooks)
  }, [])

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : t('hooksLoadError'))
    })
  }, [load, t])

  const run = async (key: string, action: () => Promise<{ ok?: boolean; message?: string }>) => {
    setBusy(key)
    setMessage(null)
    try {
      const result = await action()
      setMessage(result.message ?? (result.ok === false ? t('hooksPartialFail') : t('done')))
      await load()
      onChanged?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
      try {
        await load()
      } catch {
        // ignore
      }
    } finally {
      setBusy(null)
      setConfirmAll('')
      setConfirmOrphans('')
    }
  }

  const hasConfiguredUrl = Boolean(configuredWebhookUrl.trim())
  const orphanCount = hooks.filter((h) => h.classification === 'OTHER').length

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground">{t('remoteHooks')}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={Boolean(busy)}
          onClick={() =>
            void run('refresh', async () => {
              await load()
              return { ok: true, message: t('hooksRefreshed') }
            })
          }
        >
          {busy === 'refresh' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {t('hooksRefresh')}
        </Button>
      </div>

      {hooks.length === 0 ? (
        <p className="text-muted-foreground">{t('hooksEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {hooks.map((h) => (
            <li
              key={h.id}
              className="rounded-md border border-border/80 bg-background/50 px-2.5 py-2 space-y-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">#{h.id}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    h.classification === 'CURRENT'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
                  )}
                >
                  {h.classification === 'CURRENT' ? t('hookCurrent') : t('hookOther')}
                </span>
              </div>
              <p className="break-all text-foreground/90">{h.url}</p>
              <p>
                lastVersion {h.lastVersion ?? t('dash')}
                {h.format ? ` · ${h.format}` : ''}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={Boolean(busy)}
                onClick={() => {
                  if (!window.confirm(t('hookDeleteConfirm', { id: h.id }))) return
                  void run(`del-${h.id}`, () => deleteFlexiRemoteHook(h.id))
                }}
              >
                {busy === `del-${h.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {t('hookDelete')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-border/60 pt-2">
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={Boolean(busy) || !hasConfiguredUrl || orphanCount === 0}
            onClick={() => {
              if (!window.confirm(t('hooksDeleteOrphansWarn'))) return
              if (confirmOrphans !== 'DELETE_ORPHAN_ABRA_HOOKS') {
                setMessage(t('hooksDeleteOrphansHint'))
                return
              }
              void run('orphans', () => deleteFlexiOrphanHooks())
            }}
          >
            {busy === 'orphans' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {t('hooksDeleteOrphans')}
          </Button>
          <input
            className="w-full rounded border bg-background px-2 py-1 text-xs"
            placeholder={t('hooksDeleteOrphansHint')}
            value={confirmOrphans}
            disabled={!hasConfiguredUrl || Boolean(busy)}
            onChange={(e) => setConfirmOrphans(e.target.value)}
          />
          {!hasConfiguredUrl ? (
            <p className="text-[11px] text-amber-800 dark:text-amber-300">{t('hooksOrphansNeedUrl')}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            disabled={Boolean(busy) || hooks.length === 0}
            onClick={() => {
              if (!window.confirm(t('hooksDeleteAllWarn'))) return
              if (confirmAll !== 'DELETE_ALL_ABRA_HOOKS') {
                setMessage(t('hooksDeleteAllHint'))
                return
              }
              void run('all', () => deleteAllFlexiRemoteHooks())
            }}
          >
            {busy === 'all' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {t('hooksDeleteAll')}
          </Button>
          <input
            className="w-full rounded border bg-background px-2 py-1 text-xs"
            placeholder={t('hooksDeleteAllHint')}
            value={confirmAll}
            disabled={Boolean(busy)}
            onChange={(e) => setConfirmAll(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t('hooksDeleteAllNote')}</p>
        </div>
      </div>

      {message ? <p className="text-foreground">{message}</p> : null}
    </div>
  )
}
