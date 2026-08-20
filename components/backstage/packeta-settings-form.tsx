'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  fetchPacketaSettings,
  updatePacketaSettings,
  type PacketaAdminSettings,
} from '@/lib/backstage/packeta'

const EMPTY: PacketaAdminSettings = {
  enabled: false,
  configured: false,
  senderLabel: '',
  includeZbox: true,
  zboxMaxLongestSideCm: 60,
  zboxMaxSideSumCm: 138,
  branchMaxLongestSideCm: 120,
  branchMaxSideSumCm: 150,
  apiKeyConfigured: false,
  apiKeyMasked: '',
  apiPasswordConfigured: false,
}

export function PacketaSettingsForm() {
  const [settings, setSettings] = useState<PacketaAdminSettings>(EMPTY)
  const [senderLabel, setSenderLabel] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [includeZbox, setIncludeZbox] = useState(true)
  const [zboxMaxLongestSideCm, setZboxMaxLongestSideCm] = useState(60)
  const [zboxMaxSideSumCm, setZboxMaxSideSumCm] = useState(138)
  const [branchMaxLongestSideCm, setBranchMaxLongestSideCm] = useState(120)
  const [branchMaxSideSumCm, setBranchMaxSideSumCm] = useState(150)
  const [apiKey, setApiKey] = useState('')
  const [apiPassword, setApiPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baseline, setBaseline] = useState<string | null>(null)

  const snapshot = useCallback(
    (next: {
      enabled: boolean
      senderLabel: string
      includeZbox: boolean
      zboxMaxLongestSideCm: number
      zboxMaxSideSumCm: number
      branchMaxLongestSideCm: number
      branchMaxSideSumCm: number
      apiKey: string
      apiPassword: string
    }) =>
      JSON.stringify({
        enabled: next.enabled,
        senderLabel: next.senderLabel.trim(),
        includeZbox: next.includeZbox,
        zboxMaxLongestSideCm: next.zboxMaxLongestSideCm,
        zboxMaxSideSumCm: next.zboxMaxSideSumCm,
        branchMaxLongestSideCm: next.branchMaxLongestSideCm,
        branchMaxSideSumCm: next.branchMaxSideSumCm,
        apiKey: next.apiKey.trim(),
        apiPassword: next.apiPassword,
      }),
    [],
  )

  const dirty = useMemo(() => {
    if (!baseline) return false
    return (
      snapshot({
        enabled,
        senderLabel,
        includeZbox,
        zboxMaxLongestSideCm,
        zboxMaxSideSumCm,
        branchMaxLongestSideCm,
        branchMaxSideSumCm,
        apiKey,
        apiPassword,
      }) !== baseline
    )
  }, [
    apiKey,
    apiPassword,
    baseline,
    branchMaxLongestSideCm,
    branchMaxSideSumCm,
    enabled,
    includeZbox,
    senderLabel,
    snapshot,
    zboxMaxLongestSideCm,
    zboxMaxSideSumCm,
  ])

  const applyLoaded = useCallback(
    (next: PacketaAdminSettings) => {
      setSettings(next)
      setEnabled(next.enabled)
      setSenderLabel(next.senderLabel)
      setIncludeZbox(next.includeZbox !== false)
      setZboxMaxLongestSideCm(next.zboxMaxLongestSideCm ?? 60)
      setZboxMaxSideSumCm(next.zboxMaxSideSumCm ?? 138)
      setBranchMaxLongestSideCm(next.branchMaxLongestSideCm ?? 120)
      setBranchMaxSideSumCm(next.branchMaxSideSumCm ?? 150)
      setApiKey('')
      setApiPassword('')
      setBaseline(
        snapshot({
          enabled: next.enabled,
          senderLabel: next.senderLabel,
          includeZbox: next.includeZbox !== false,
          zboxMaxLongestSideCm: next.zboxMaxLongestSideCm ?? 60,
          zboxMaxSideSumCm: next.zboxMaxSideSumCm ?? 138,
          branchMaxLongestSideCm: next.branchMaxLongestSideCm ?? 120,
          branchMaxSideSumCm: next.branchMaxSideSumCm ?? 150,
          apiKey: '',
          apiPassword: '',
        }),
      )
    },
    [snapshot],
  )

  const load = useCallback(async () => {
    try {
      const next = await fetchPacketaSettings()
      applyLoaded(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити Packeta.')
    } finally {
      setLoading(false)
    }
  }, [applyLoaded])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const payload: {
        enabled: boolean
        senderLabel: string
        includeZbox: boolean
        zboxMaxLongestSideCm: number
        zboxMaxSideSumCm: number
        branchMaxLongestSideCm: number
        branchMaxSideSumCm: number
        apiKey?: string
        apiPassword?: string
      } = {
        enabled,
        senderLabel: senderLabel.trim(),
        includeZbox,
        zboxMaxLongestSideCm,
        zboxMaxSideSumCm,
        branchMaxLongestSideCm,
        branchMaxSideSumCm,
      }
      if (apiKey.trim()) payload.apiKey = apiKey.trim()
      if (apiPassword) payload.apiPassword = apiPassword

      const next = await updatePacketaSettings(payload)
      applyLoaded(next)
      toast.success(
        next.configured
          ? 'Packeta збережено. Пошук výdejních míst увімкнено.'
          : 'Packeta збережено. Для пошуку пунктів потрібні API key і Sender.',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти Packeta.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Завантаження Packeta…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Packeta (Zásilkovna)</CardTitle>
          <CardDescription>
            API key і Sender потрібні, щоб на checkout працював пошук výdejních míst / Z-BOX.
            API password — для майбутнього створення посилок (зараз не обовʼязковий). Ключі з{' '}
            <span className="font-medium text-foreground">Packeta Client → User support</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Увімкнено</p>
              <p className="text-xs text-muted-foreground">
                Без цього пошук пунктів на сайті недоступний.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Показувати Z-BOX</p>
              <p className="text-xs text-muted-foreground">
                Вимкніть, щоб у списку лишилися лише звичайні vydajní místa (без скриньок).
              </p>
            </div>
            <Switch checked={includeZbox} onCheckedChange={setIncludeZbox} />
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            Статус:{' '}
            <span className={settings.configured ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
              {settings.configured ? 'готово до пошуку пунктів' : 'не налаштовано'}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packeta-sender">Sender label (eshop ID)</Label>
            <Input
              id="packeta-sender"
              value={senderLabel}
              onChange={(e) => setSenderLabel(e.target.value)}
              placeholder="наприклад green-angels"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packeta-api-key">API key</Label>
            <Input
              id="packeta-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings.apiKeyConfigured
                  ? `Збережено: ${settings.apiKeyMasked} — залиште порожнім, щоб не змінювати`
                  : 'Вставте API key з Packeta Client'
              }
              autoComplete="new-password"
            />
            {settings.apiKeyConfigured ? (
              <p className="text-xs text-muted-foreground">Ключ уже збережений у базі.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="packeta-api-password">API password (опційно зараз)</Label>
            <Input
              id="packeta-api-password"
              type="password"
              value={apiPassword}
              onChange={(e) => setApiPassword(e.target.value)}
              placeholder={
                settings.apiPasswordConfigured
                  ? 'Збережено — залиште порожнім, щоб не змінювати'
                  : 'Для створення посилок / етикеток пізніше'
              }
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 p-3">
            <div>
              <p className="text-sm font-medium">Габарити для фільтра пунктів</p>
              <p className="text-xs text-muted-foreground">
                На checkout ховаються пункти, у які кошик не вміщується (за найдовшою стороною та
                сумою L+W+H). Z-BOX за замовчуванням — шафа L (60 / 138 см).
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="packeta-zbox-longest">Z-BOX · макс. сторона (см)</Label>
                <Input
                  id="packeta-zbox-longest"
                  type="number"
                  min={0}
                  value={zboxMaxLongestSideCm}
                  onChange={(e) => setZboxMaxLongestSideCm(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packeta-zbox-sum">Z-BOX · макс. L+W+H (см)</Label>
                <Input
                  id="packeta-zbox-sum"
                  type="number"
                  min={0}
                  value={zboxMaxSideSumCm}
                  onChange={(e) => setZboxMaxSideSumCm(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packeta-branch-longest">Výdejní · макс. сторона (см)</Label>
                <Input
                  id="packeta-branch-longest"
                  type="number"
                  min={0}
                  value={branchMaxLongestSideCm}
                  onChange={(e) =>
                    setBranchMaxLongestSideCm(Math.max(0, Number(e.target.value) || 0))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packeta-branch-sum">Výdejní · макс. L+W+H (см)</Label>
                <Input
                  id="packeta-branch-sum"
                  type="number"
                  min={0}
                  value={branchMaxSideSumCm}
                  onChange={(e) => setBranchMaxSideSumCm(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()} disabled={saving}>
              Скасувати зміни
            </Button>
          </div>
        </CardContent>
      </Card>

      <FormSaveBar isDirty={dirty} saving={saving} onSave={() => void save()} />
    </div>
  )
}
