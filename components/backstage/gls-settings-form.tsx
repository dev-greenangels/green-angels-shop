'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  fetchGlsSettings,
  updateGlsSettings,
  type GlsAdminSettings,
} from '@/lib/backstage/gls'
import { buildGlsOwnedCheckoutPatch } from '@/lib/backstage/cart-checkout-ownership'
import {
  fetchBackstageSettings,
  updateBackstageCartCheckoutSettings,
} from '@/lib/backstage/settings'
import { normalizeCartCheckoutSettings } from '@/lib/settings/cart-checkout.normalize'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import type { CartCheckoutSettings } from '@/lib/settings/types'

/** Dirty-check slice for GLS-owned cart fields only. */
function glsCartSlice(cart: CartCheckoutSettings) {
  return {
    carrierConfigs: {
      gls: cart.carrierConfigs?.gls ?? {},
    },
  }
}

function resolveGlsCourierLimits(cart: CartCheckoutSettings): {
  maxLongestSideCm: number
  maxGirthCm: number
} {
  const fromConfig = cart.carrierConfigs?.gls?.services?.['gls-courier']
  const fromCart = cart.cartSize?.limits?.find((row) => row.method === 'gls-courier')
  return {
    maxLongestSideCm: fromConfig?.maxLongestSideCm ?? fromCart?.maxLongestSideCm ?? 0,
    maxGirthCm: fromConfig?.maxGirthCm ?? fromCart?.maxGirthCm ?? 0,
  }
}

/**
 * GLS connection + physical limits / tariff NET flag in cart.checkout.carrierConfigs.gls.
 * Tariffs left empty until contractual rates exist — do not invent prices.
 */
export function GlsSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<GlsAdminSettings | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [apiUrl, setApiUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [clientNumber, setClientNumber] = useState('')
  const [cart, setCart] = useState<CartCheckoutSettings>(DEFAULT_CART_CHECKOUT_SETTINGS)
  const [baselineApi, setBaselineApi] = useState<string | null>(null)
  const [baselineCart, setBaselineCart] = useState<string | null>(null)

  const applyLoadedApi = useCallback((next: GlsAdminSettings) => {
    setSettings(next)
    setEnabled(next.enabled)
    setApiUrl(next.apiUrl)
    setClientNumber(next.clientNumber)
    setUsername('')
    setPassword('')
    setBaselineApi(
      JSON.stringify({
        enabled: next.enabled,
        apiUrl: next.apiUrl,
        clientNumber: next.clientNumber,
        username: '',
        password: '',
      }),
    )
  }, [])

  const applyLoadedCart = useCallback((next: CartCheckoutSettings) => {
    const normalized = normalizeCartCheckoutSettings(next)
    setCart(normalized)
    setBaselineCart(JSON.stringify(glsCartSlice(normalized)))
  }, [])

  const load = useCallback(async () => {
    try {
      const [apiNext, site] = await Promise.all([
        fetchGlsSettings(),
        fetchBackstageSettings(),
      ])
      applyLoadedApi(apiNext)
      applyLoadedCart(normalizeCartCheckoutSettings(site.cart ?? null))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити GLS')
    } finally {
      setLoading(false)
    }
  }, [applyLoadedApi, applyLoadedCart])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    if (!baselineApi || !baselineCart) return false
    const apiDirty =
      JSON.stringify({ enabled, apiUrl, clientNumber, username, password }) !== baselineApi
    const cartDirty = JSON.stringify(glsCartSlice(cart)) !== baselineCart
    return apiDirty || cartDirty
  }, [
    apiUrl,
    baselineApi,
    baselineCart,
    cart,
    clientNumber,
    enabled,
    password,
    username,
  ])

  const glsTariffsAreNet =
    cart.carrierConfigs?.gls?.tariffAmountsAreNet ?? cart.carrierTariffAmountsAreNet !== false
  const glsLimits = resolveGlsCourierLimits(cart)

  const patchGlsLimits = (field: 'maxLongestSideCm' | 'maxGirthCm', value: number) => {
    const prevSvc = cart.carrierConfigs?.gls?.services?.['gls-courier'] ?? {}
    const nextSvc = { ...prevSvc, [field]: value }
    const limits = [...(cart.cartSize?.limits ?? [])]
    const idx = limits.findIndex((row) => row.method === 'gls-courier')
    const prev =
      idx >= 0
        ? limits[idx]
        : {
            method: 'gls-courier' as const,
            maxLongestSideCm: 0,
            maxSideSumCm: 0,
            maxGirthCm: 0,
          }
    const nextRow = {
      ...prev,
      method: 'gls-courier' as const,
      maxLongestSideCm:
        field === 'maxLongestSideCm' ? value : prev.maxLongestSideCm,
      maxGirthCm: field === 'maxGirthCm' ? value : prev.maxGirthCm,
    }
    if (idx >= 0) limits[idx] = nextRow
    else limits.push(nextRow)

    setCart((c) =>
      normalizeCartCheckoutSettings({
        ...c,
        carrierConfigs: {
          ...c.carrierConfigs,
          gls: {
            ...c.carrierConfigs?.gls,
            services: {
              ...c.carrierConfigs?.gls?.services,
              'gls-courier': nextSvc,
            },
          },
        },
        cartSize: {
          enabled: c.cartSize?.enabled ?? true,
          limits,
        },
      }),
    )
  }

  const setGlsTariffAmountsAreNet = (value: boolean) => {
    setCart((c) =>
      normalizeCartCheckoutSettings({
        ...c,
        // GLS owns NET under carrierConfigs.gls — do not write legacy root flag.
        carrierConfigs: {
          ...c.carrierConfigs,
          gls: {
            ...c.carrierConfigs?.gls,
            tariffAmountsAreNet: value,
          },
        },
      }),
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const patch: Parameters<typeof updateGlsSettings>[0] = {
        enabled,
        apiUrl,
        clientNumber,
      }
      if (username.trim()) patch.username = username.trim()
      if (password.trim()) patch.password = password.trim()

      const [apiNext, cartNext] = await Promise.all([
        updateGlsSettings(patch),
        updateBackstageCartCheckoutSettings(buildGlsOwnedCheckoutPatch(cart)),
      ])
      applyLoadedApi(apiNext)
      applyLoadedCart(cartNext)
      toast.success('GLS збережено (API + physical limits)')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження GLS')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Завантаження GLS…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GLS — Connection</CardTitle>
          <CardDescription>
            Credentials для майбутнього createShipment / labels. Тарифи поки не вигадані.
            Storage: <code className="text-xs">integration.gls</code>. Ліміти — у{' '}
            <code className="text-xs">cart.checkout.carrierConfigs.gls</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Увімкнено</p>
              <p className="text-xs text-muted-foreground">
                Не вмикає тарифи на checkout — лише інтеграційний прапорець.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            Статус:{' '}
            <span
              className={
                settings.configured ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'
              }
            >
              {settings.configured ? 'облікові дані збережено' : 'не налаштовано'}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gls-api-url">API URL</Label>
            <Input
              id="gls-api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.mygls.sk"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gls-client">Client number</Label>
            <Input
              id="gls-client"
              value={clientNumber}
              onChange={(e) => setClientNumber(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gls-user">Username</Label>
            <Input
              id="gls-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                settings.hasUsername
                  ? 'Збережено — залиште порожнім, щоб не змінювати'
                  : 'Username MyGLS'
              }
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gls-password">Password</Label>
            <Input
              id="gls-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Залиште порожнім, щоб не змінювати"
              autoComplete="new-password"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GLS — фізичні ліміти та базис тарифів</CardTitle>
          <CardDescription>
            gls-courier → carrierConfigs.gls.services + проєкція в cartSize.limits. Тарифи не
            вигадані.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Тарифи GLS вводяться як</Label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gls-tariff-price-basis"
                  checked={glsTariffsAreNet}
                  onChange={() => setGlsTariffAmountsAreNet(true)}
                />
                NET — без ПДВ
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gls-tariff-price-basis"
                  checked={!glsTariffsAreNet}
                  onChange={() => setGlsTariffAmountsAreNet(false)}
                />
                GROSS — з ПДВ
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Stored in <code className="text-xs">carrierConfigs.gls.tariffAmountsAreNet</code>.
              Root <code className="text-xs">carrierTariffAmountsAreNet</code> is legacy fallback
              only.
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2">
            <p className="text-sm font-medium sm:col-span-2">gls-courier</p>
            <div className="space-y-1">
              <Label className="text-xs">Макс. найдовша сторона (см)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={glsLimits.maxLongestSideCm}
                onChange={(e) =>
                  patchGlsLimits(
                    'maxLongestSideCm',
                    Math.max(0, Number(e.target.value) || 0),
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Макс. girth (см)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={glsLimits.maxGirthCm}
                onChange={(e) =>
                  patchGlsLimits('maxGirthCm', Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              0 = не перевіряти поле. GLS SK типово: довжина ≤200, girth ≤300 — не підставляємо
              автоматично.
            </p>
          </div>

          <Card className="border-dashed shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Services / Tariffs / COD</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Тарифні таблиці GLS порожні — без вигаданих цін. Пізніше сюди підключаться rate
              tables і COD rules.
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <FormSaveBar isDirty={dirty} saving={saving} onSave={() => void save()} />
    </div>
  )
}
