'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { FlexiQueueCard } from '@/components/backstage/flexi-queue-card'
import { FormSaveBar } from '@/components/backstage/form-save-bar'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  fetchFlexiSettings,
  disableFlexiWebhook,
  registerFlexiWebhook,
  refreshFlexiWebhookStatus,
  runFlexiFullSync,
  runFlexiPollChanges,
  runFlexiStromSync,
  testFlexiConnection,
  updateFlexiSettings,
  type FlexiDocumentSendMode,
  type FlexiFullSyncSchedule,
  type FlexiPublicSettings,
  type FlexiScheduleMode,
} from '@/lib/backstage/flexi'
import {
  CHECKOUT_DELIVERY_METHODS,
  DELIVERY_METHOD_BACKSTAGE_LABELS,
} from '@/lib/checkout/methods'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTimeOrDash } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'

const DOCUMENT_SEND_OPTIONS: Array<{ value: FlexiDocumentSendMode; label: string }> = [
  { value: 'site', label: 'Лише сайт (PDF підтвердження)' },
  { value: 'abra', label: 'Лише ABRA Flexi (SMTP / doklad)' },
  { value: 'both', label: 'Сайт і ABRA' },
  { value: 'none', label: 'Не надсилати автоматично' },
]

const WEEKDAY_LABELS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const

const DEFAULT_SCHEDULE: FlexiFullSyncSchedule = {
  enabled: false,
  mode: 'daily',
  hour: 3,
  minute: 0,
  dayOfWeek: 1,
  dayOfMonth: 1,
}

const DEFAULT_DELIVERY_METHOD_CODES: Record<string, string> = {
  'packeta-box': 'PACKETA_PICKUP',
  'packeta-courier': 'PACKETA_COURIER',
  pickup: 'PICKUP',
  'gls-courier': 'GLS_COURIER',
}

const EMPTY: FlexiPublicSettings = {
  enabled: false,
  configured: false,
  baseUrl: '',
  companyId: '',
  defaultStockCode: '',
  orderDocTypeCode: 'OBP',
  centerCode: 'SITE',
  orderUserStatus: 'stavDoklObch.schvaleno',
  issuedInvoiceTypeCode: 'FAKTURA',
  shippingCenikKod: 'SHIPPING',
  boxesCenikKod: 'BOXES',
  codFeeCenikKod: 'COD',
  deliveryMethodCodes: { ...DEFAULT_DELIVERY_METHOD_CODES },
  defaultCategoryId: '',
  stromRootCode: 'STR_CEN',
  stromShopRootCode: '',
  syncCategoriesFromStrom: true,
  sizeAttributeId: '',
  webhookUrl: '',
  hasWebhookSecKey: false,
  webhookAccepting: true,
  webhookRemoteId: '',
  webhookRegistrationStatus: 'NOT_REGISTERED',
  hasUsername: false,
  documentSend: { b2b: 'abra', b2c: 'site' },
  globalVersion: 0,
  backupPollEveryHours: 6,
  fullSyncSchedule: { ...DEFAULT_SCHEDULE },
  fullSyncScheduleLabel: 'вимкнено',
  apiCallsToday: 0,
  apiCallsWarnThreshold: 8000,
  lastSyncStatus: 'never',
}

function applyLoadedFlexiSettings(next: FlexiPublicSettings): FlexiPublicSettings {
  const loaded = {
    ...EMPTY,
    ...next,
    fullSyncSchedule: { ...DEFAULT_SCHEDULE, ...next.fullSyncSchedule },
    documentSend: { ...EMPTY.documentSend, ...next.documentSend },
    deliveryMethodCodes: {
      ...DEFAULT_DELIVERY_METHOD_CODES,
      ...next.deliveryMethodCodes,
    },
    stromShopRootCode: next.stromShopRootCode ?? '',
  }
  const tree = (loaded.stromRootCode || 'STR_CEN').trim()
  if (!loaded.stromShopRootCode.trim() && tree && tree.toUpperCase() !== 'STR_CEN' && !tree.toUpperCase().startsWith('STR_')) {
    return { ...loaded, stromRootCode: 'STR_CEN', stromShopRootCode: tree }
  }
  return loaded
}

function editableFlexiSnapshot(
  settings: FlexiPublicSettings,
  username: string,
  password: string,
  webhookSecKey: string,
) {
  return JSON.stringify({
    enabled: settings.enabled,
    baseUrl: settings.baseUrl,
    companyId: settings.companyId,
    defaultStockCode: settings.defaultStockCode,
    orderDocTypeCode: settings.orderDocTypeCode,
    centerCode: settings.centerCode,
    orderUserStatus: settings.orderUserStatus,
    issuedInvoiceTypeCode: settings.issuedInvoiceTypeCode,
    shippingCenikKod: settings.shippingCenikKod,
    boxesCenikKod: settings.boxesCenikKod,
    codFeeCenikKod: settings.codFeeCenikKod,
    deliveryMethodCodes: settings.deliveryMethodCodes,
    defaultCategoryId: settings.defaultCategoryId,
    stromRootCode: settings.stromRootCode,
    stromShopRootCode: settings.stromShopRootCode,
    syncCategoriesFromStrom: settings.syncCategoriesFromStrom,
    sizeAttributeId: settings.sizeAttributeId,
    webhookUrl: settings.webhookUrl,
    documentSend: settings.documentSend,
    backupPollEveryHours: settings.backupPollEveryHours,
    fullSyncSchedule: settings.fullSyncSchedule,
    username,
    password,
    webhookSecKey,
  })
}

export function FlexiSettingsForm() {
  const { locale } = useBackstageUiLocale()
  const [settings, setSettings] = useState<FlexiPublicSettings>(EMPTY)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [webhookSecKey, setWebhookSecKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [baseline, setBaseline] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchFlexiSettings()
      const applied = applyLoadedFlexiSettings(next)
      setSettings(applied)
      setUsername('')
      setPassword('')
      setWebhookSecKey('')
      setBaseline(editableFlexiSnapshot(applied, '', '', ''))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити Flexi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchSchedule = (patch: Partial<FlexiFullSyncSchedule>) => {
    setSettings((s) => ({
      ...s,
      fullSyncSchedule: { ...s.fullSyncSchedule, ...patch },
    }))
  }

  const isDirty = useMemo(
    () => editableFlexiSnapshot(settings, username, password, webhookSecKey) !== baseline,
    [settings, username, password, webhookSecKey, baseline],
  )

  const save = async () => {
    setSaving(true)
    try {
      const next = await updateFlexiSettings({
        enabled: settings.enabled,
        baseUrl: settings.baseUrl,
        companyId: settings.companyId,
        defaultStockCode: settings.defaultStockCode,
        orderDocTypeCode: settings.orderDocTypeCode,
        centerCode: settings.centerCode,
        orderUserStatus: settings.orderUserStatus,
        issuedInvoiceTypeCode: settings.issuedInvoiceTypeCode,
        shippingCenikKod: settings.shippingCenikKod,
        boxesCenikKod: settings.boxesCenikKod,
        codFeeCenikKod: settings.codFeeCenikKod,
        deliveryMethodCodes: settings.deliveryMethodCodes,
        defaultCategoryId: settings.defaultCategoryId,
        stromRootCode: settings.stromRootCode,
        stromShopRootCode: settings.stromShopRootCode,
        syncCategoriesFromStrom: settings.syncCategoriesFromStrom,
        sizeAttributeId: settings.sizeAttributeId,
        webhookUrl: settings.webhookUrl,
        documentSend: settings.documentSend,
        backupPollEveryHours: settings.backupPollEveryHours,
        fullSyncSchedule: settings.fullSyncSchedule,
        ...(username.trim() ? { username: username.trim() } : {}),
        ...(password ? { password } : {}),
        ...(webhookSecKey ? { webhookSecKey } : {}),
      })
      const applied = applyLoadedFlexiSettings(next)
      setSettings(applied)
      setPassword('')
      setWebhookSecKey('')
      setUsername('')
      setBaseline(editableFlexiSnapshot(applied, '', '', ''))
      toast.success('Налаштування ABRA Flexi збережено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const run = async (key: string, action: () => Promise<{ message?: string; ok?: boolean }>) => {
    setBusy(key)
    try {
      const result = await action()
      if (result.ok === false) {
        toast.error(result.message || 'Операція не вдалася')
      } else {
        toast.success(result.message || 'Готово')
      }
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Завантаження…
      </div>
    )
  }

  const schedule = settings.fullSyncSchedule
  const timeValue = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`
  const apiNearLimit = settings.apiCallsToday >= settings.apiCallsWarnThreshold

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ABRA Flexi</CardTitle>
          <CardDescription>
            Склад, ціни й замовлення для SK. Збереження — кнопка внизу. Автооновлення складається з
            трьох різних каналів: webhook (живі зміни), підстраховка журналу, рідкий повний прайс.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="font-medium">Увімкнено</p>
              <p className="text-sm text-muted-foreground">
                {settings.configured ? 'Credentials задані' : 'Потрібні Base URL, Company ID і логін'}
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings((s) => ({ ...s, enabled }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="flexi-base-url">Base URL (хост Flexi без /c/…)</Label>
              <Input
                id="flexi-base-url"
                value={settings.baseUrl}
                onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
                placeholder="https://demo.flexibee.eu"
              />
              <p className="text-xs text-muted-foreground">
                Не додавайте /c/company — Company ID задається окремо.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-company">Company ID (сегмент /c/&#123;id&#125;/)</Label>
              <Input
                id="flexi-company"
                value={settings.companyId}
                onChange={(e) => setSettings((s) => ({ ...s, companyId: e.target.value }))}
                placeholder="green_angels_sro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-stock">Код складу в Flexi (скорочення, не WH-MAIN)</Label>
              <Input
                id="flexi-stock"
                value={settings.defaultStockCode}
                onChange={(e) => setSettings((s) => ({ ...s, defaultStockCode: e.target.value }))}
                placeholder="SKLAD"
              />
              <p className="text-xs text-muted-foreground">
                Точний код складу з ABRA (Evidence → Sklady). Checkout читає dostupMj; export
                ставить sklad на рядках. Порожньо або невалідний код — export без sklad.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-user">
                Логін {settings.hasUsername ? '(задано)' : ''}
              </Label>
              <Input
                id="flexi-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="залиште порожнім щоб не змінювати"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-pass">Пароль (новий, шифрується at rest)</Label>
              <Input
                id="flexi-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="залиште порожнім щоб не змінювати"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-doc-type">Тип dokladu (objednávka)</Label>
              <Input
                id="flexi-doc-type"
                value={settings.orderDocTypeCode}
                onChange={(e) => setSettings((s) => ({ ...s, orderDocTypeCode: e.target.value }))}
                placeholder="OBP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-center">Středisko (center)</Label>
              <Input
                id="flexi-center"
                value={settings.centerCode}
                onChange={(e) => setSettings((s) => ({ ...s, centerCode: e.target.value }))}
                placeholder="SITE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-status">Статус dokladu (stavUzivK)</Label>
              <Input
                id="flexi-status"
                value={settings.orderUserStatus}
                onChange={(e) => setSettings((s) => ({ ...s, orderUserStatus: e.target.value }))}
                placeholder="stavDoklObch.schvaleno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-invoice-type">Тип майбутньої фактури (typDoklNabFak)</Label>
              <Input
                id="flexi-invoice-type"
                value={settings.issuedInvoiceTypeCode}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, issuedInvoiceTypeCode: e.target.value }))
                }
                placeholder="FAKTURA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-shipping-cenik">Cenik доставки</Label>
              <Input
                id="flexi-shipping-cenik"
                value={settings.shippingCenikKod ?? 'SHIPPING'}
                onChange={(e) => setSettings((s) => ({ ...s, shippingCenikKod: e.target.value }))}
                placeholder="SHIPPING"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-boxes-cenik">Cenik пакування</Label>
              <Input
                id="flexi-boxes-cenik"
                value={settings.boxesCenikKod ?? 'BOXES'}
                onChange={(e) => setSettings((s) => ({ ...s, boxesCenikKod: e.target.value }))}
                placeholder="BOXES"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-cod-cenik">Cenik dobierka (порожньо = не слати)</Label>
              <Input
                id="flexi-cod-cenik"
                value={settings.codFeeCenikKod ?? 'COD'}
                onChange={(e) => setSettings((s) => ({ ...s, codFeeCenikKod: e.target.value }))}
                placeholder="COD"
              />
            </div>
            <div className="space-y-3 sm:col-span-2">
              <div className="space-y-1">
                <Label>Forma dopravy (Abbreviation у ABRA Flexi)</Label>
                <p className="text-xs text-muted-foreground">
                  Вкажіть Abbreviation способу доставки з ABRA Flexi. Значення використовується
                  для поля Forma dopravy.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from(
                  new Set([
                    ...CHECKOUT_DELIVERY_METHODS,
                    ...Object.keys(settings.deliveryMethodCodes ?? {}),
                  ]),
                ).map((method) => (
                  <div key={method} className="space-y-2">
                    <Label htmlFor={`flexi-doprava-${method}`}>
                      {DELIVERY_METHOD_BACKSTAGE_LABELS[
                        method as keyof typeof DELIVERY_METHOD_BACKSTAGE_LABELS
                      ] ?? method}
                    </Label>
                    <Input
                      id={`flexi-doprava-${method}`}
                      value={settings.deliveryMethodCodes?.[method] ?? ''}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          deliveryMethodCodes: {
                            ...s.deliveryMethodCodes,
                            [method]: e.target.value,
                          },
                        }))
                      }
                      onBlur={() =>
                        setSettings((s) => ({
                          ...s,
                          deliveryMethodCodes: {
                            ...s.deliveryMethodCodes,
                            [method]: (s.deliveryMethodCodes?.[method] ?? '').trim().toUpperCase(),
                          },
                        }))
                      }
                      placeholder="порожньо = не слати"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Документи клієнту — B2B</Label>
              <Select
                value={settings.documentSend.b2b}
                onValueChange={(value: FlexiDocumentSendMode) =>
                  setSettings((s) => ({
                    ...s,
                    documentSend: { ...s.documentSend, b2b: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_SEND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Документи клієнту — B2C</Label>
              <Select
                value={settings.documentSend.b2c}
                onValueChange={(value: FlexiDocumentSendMode) =>
                  setSettings((s) => ({
                    ...s,
                    documentSend: { ...s.documentSend, b2c: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_SEND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strom → каталог сайту</CardTitle>
          <CardDescription>
            Вузол з дітьми = категорія; лист = товар; cenik під листом = варіанти (SKU = kod).
            Utility-вузли (Added items, Tree in price list) пропускаються. Корінь Strom краще
            вказати як код вузла Catalog. Зовнішній id товару ={' '}
            <span className="font-mono text-xs">flexi:{'{id}'}</span> — sync не чіпає чужі
            картки; у Flexi йде лише kod/SKU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="font-medium">Синхронізувати дерево Strom</p>
              <p className="text-sm text-muted-foreground">
                Branch → Category, leaf → Product, strom-cenik → variants
              </p>
            </div>
            <Switch
              checked={settings.syncCategoriesFromStrom}
              onCheckedChange={(syncCategoriesFromStrom) =>
                setSettings((s) => ({ ...s, syncCategoriesFromStrom }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flexi-strom-root">Код дерева Strom (Tree in price list)</Label>
              <Input
                id="flexi-strom-root"
                value={settings.stromRootCode}
                onChange={(e) => setSettings((s) => ({ ...s, stromRootCode: e.target.value }))}
                placeholder="STR_CEN"
              />
              <p className="text-xs text-muted-foreground">
                Код дерева ABRA, зазвичай STR_CEN. Не ставте сюди папку Products.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-strom-shop">Папка каталогу на сайті</Label>
              <Input
                id="flexi-strom-shop"
                value={settings.stromShopRootCode}
                onChange={(e) => setSettings((s) => ({ ...s, stromShopRootCode: e.target.value }))}
                placeholder="Products"
              />
              <p className="text-xs text-muted-foreground">
                Код вузла всередині дерева (Products). На сайт піде лише ця гілка; Products стане
                коренем каталогу. Materials і Non-added items ігноруються.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flexi-size-attr">Size / Container attribute UUID (опційно)</Label>
              <Input
                id="flexi-size-attr"
                value={settings.sizeAttributeId}
                onChange={(e) => setSettings((s) => ({ ...s, sizeAttributeId: e.target.value }))}
                placeholder="порожньо = авто: CONTAINER або slug size/rozmer"
              />
              <p className="text-xs text-muted-foreground">
                З SKU PENN-ALO-LADYU-C2 береться суфікс C2 → значення атрибута. EAN у Flexi не
                потрібен — звʼязок лише по kod/SKU.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="flexi-category">
                Fallback category UUID (сайт) — orphan cenik поза деревом
              </Label>
              <Input
                id="flexi-category"
                value={settings.defaultCategoryId}
                onChange={(e) => setSettings((s) => ({ ...s, defaultCategoryId: e.target.value }))}
                placeholder="uuid категорії магазину, не Flexi id"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook — основний live-sync</CardTitle>
          <CardDescription>
            Flexi сам надсилає зміни (ціна, залишок, дерево, замовлення). Це не те саме, що розклад
            прайсу і не те саме, що підстраховка журналу нижче. Вимкнути webhook ≠ зупинити poll /
            експорт замовлень / checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Увімкніть Changes API:{' '}
              <code className="text-xs">/c/&#123;firma&#125;/changes/control</code>
            </li>
            <li>
              Nest endpoint:{' '}
              <code className="text-xs">POST &#123;API_PUBLIC_URL&#125;/flexi/webhook</code>
            </li>
            <li>
              Збережіть URL + secKey нижче → «Підключити webhook» (PUT hooks.json?format=JSON&amp;secKey=…)
            </li>
            <li>Flexi надсилає зміни cenik / strom / strom-cenik / skladova-karta / objednavka-prijata</li>
          </ol>

          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Статус реєстрації: </span>
              <span className="font-medium">
                {settings.webhookRegistrationStatus === 'REGISTERED'
                  ? 'Зареєстровано'
                  : settings.webhookRegistrationStatus === 'DISABLED'
                    ? 'Вимкнено'
                    : settings.webhookRegistrationStatus === 'ERROR'
                      ? 'Помилка'
                      : settings.webhookRegistrationStatus === 'UNKNOWN'
                        ? 'Невідомо'
                        : 'Не зареєстровано'}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Локальний прийом (webhookAccepting): </span>
              {settings.webhookAccepting === false ? 'вимкнено' : 'увімкнено'}
            </p>
            {settings.webhookRemoteId ? (
              <p>
                <span className="text-muted-foreground">Remote hook id: </span>
                <code className="text-xs">{settings.webhookRemoteId}</code>
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Закладка журналу (курсор): </span>
              {settings.globalVersion}
            </p>
            {settings.webhookLastRegisterAt ? (
              <p>
                <span className="text-muted-foreground">Остання реєстрація: </span>
                {formatDateTimeOrDash(settings.webhookLastRegisterAt, locale, 'datetimeSeconds')}
              </p>
            ) : null}
            {settings.webhookLastError ? (
              <p className="text-destructive break-words">
                <span className="text-muted-foreground">Остання помилка: </span>
                {settings.webhookLastError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="flexi-webhook-url">Webhook URL (публічний Nest)</Label>
              <Input
                id="flexi-webhook-url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings((s) => ({ ...s, webhookUrl: e.target.value }))}
                placeholder="https://api.example.com/flexi/webhook"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="flexi-webhook-key">
                Webhook secKey {settings.hasWebhookSecKey ? '(задано, шифрується)' : ''}
              </Label>
              <Input
                id="flexi-webhook-key"
                type="password"
                value={webhookSecKey}
                onChange={(e) => setWebhookSecKey(e.target.value)}
                placeholder="новий ключ або порожньо"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() =>
                void run('hook', async () => {
                  const result = await registerFlexiWebhook()
                  await load()
                  return result
                })
              }
            >
              {busy === 'hook' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Підключити webhook
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() =>
                void run('hook-off', async () => {
                  const result = await disableFlexiWebhook()
                  await load()
                  return result
                })
              }
            >
              {busy === 'hook-off' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Вимкнути webhook
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={Boolean(busy)}
              onClick={() =>
                void run('hook-status', async () => {
                  const result = await refreshFlexiWebhookStatus()
                  await load()
                  return result
                })
              }
            >
              {busy === 'hook-status' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Оновити статус
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Підстраховка журналу змін (не розклад прайсу)</CardTitle>
          <CardDescription>
            Раз на N годин Nest питає Flexi «що нового з закладки». Це запас, якщо webhook не
            дійшов. Не проходить увесь прайс і не замінює кнопку «Оновити каталог». 0 = вимкнено.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="flexi-backup-poll">Інтервал, годин</Label>
            <Input
              id="flexi-backup-poll"
              type="number"
              min={0}
              max={168}
              value={settings.backupPollEveryHours}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  backupPollEveryHours: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Якщо webhook живий — ставте 0. Інакше 6–24. Ручний знімок («Оновити існуючі» /
              «Імпорт з ABRA») теж закриває журнал каталогу. Кнопка «Наздогнати журнал» у ремонті —
              лише якщо webhook відстав і знімка ще не було.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Розклад повного проходу прайсу</CardTitle>
          <CardDescription>
            Окремий важкий job: сторінка за сторінкою весь cenik, лише вже існуючі SKU на сайті.
            Не журнал змін і не імпорт дерева. Те саме, що кнопка «Пройти весь прайс».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="font-medium">Увімкнути розклад</p>
              <p className="text-xs text-muted-foreground">{settings.fullSyncScheduleLabel}</p>
            </div>
            <Switch
              checked={schedule.enabled}
              onCheckedChange={(enabled) => patchSchedule({ enabled })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Режим</Label>
              <Select
                value={schedule.mode}
                onValueChange={(mode: FlexiScheduleMode) => patchSchedule({ mode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Щодня</SelectItem>
                  <SelectItem value="weekly">Щотижня</SelectItem>
                  <SelectItem value="monthly">Щомісяця</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Час</Label>
              <input
                type="time"
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                value={timeValue}
                onChange={(e) => {
                  const [hour, minute] = e.target.value.split(':').map(Number)
                  patchSchedule({
                    hour: Number.isFinite(hour) ? hour : schedule.hour,
                    minute: Number.isFinite(minute) ? minute : schedule.minute,
                  })
                }}
              />
            </div>
            {schedule.mode === 'weekly' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>День тижня</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, day) => (
                    <button
                      key={label}
                      type="button"
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition-colors',
                        schedule.dayOfWeek === day
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                      onClick={() => patchSchedule({ dayOfWeek: day })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {schedule.mode === 'monthly' ? (
              <div className="space-y-2">
                <Label htmlFor="flexi-dom">День місяця (1–28)</Label>
                <Input
                  id="flexi-dom"
                  type="number"
                  min={1}
                  max={28}
                  value={schedule.dayOfMonth}
                  onChange={(e) =>
                    patchSchedule({
                      dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Дії синхронізації</CardTitle>
          <CardDescription>
            У повсякденні достатньо webhook. Дві кнопки нижче — ручний знімок з дерева ABRA (ті самі
            поля: назви, Text above/below, описи, ціни, сток). Після успіху журнал каталогу
            закривається, щоб webhook не ганяв той самий backlog знову.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground space-y-1">
            <p>
              Запитів до Flexi сьогодні (доба UTC): {settings.apiCallsToday}
              {settings.apiCallsWarnThreshold
                ? ` (попередження від ${settings.apiCallsWarnThreshold})`
                : ''}
              . Webhook у цей ліміт не входить.
            </p>
            {apiNearLimit ? (
              <p className="text-amber-700 dark:text-amber-400">
                Близько до денного ліміту — рідше запускайте ручний імпорт.
              </p>
            ) : null}
            <p>
              Останній журнал / повний прайс:{' '}
              {formatDateTimeOrDash(settings.lastSyncAt, locale, 'datetimeSeconds')} (
              {settings.lastSyncStatus ?? 'never'}) — одне поле на обидві дії; дивіться текст нижче.
            </p>
            {settings.lastSyncMessage ? <p>{settings.lastSyncMessage}</p> : null}
            <p>
              Останнє оновлення каталогу з дерева:{' '}
              {formatDateTimeOrDash(settings.lastStromSyncAt, locale, 'datetimeSeconds')}
            </p>
            {settings.lastStromSyncMessage ? <p>{settings.lastStromSyncMessage}</p> : null}
            <p>Версія змін Flexi: {settings.globalVersion}</p>
            {settings.lastExportAt ? (
              <p>
                Останнє відправлення замовлення в Flexi:{' '}
                {formatDateTimeOrDash(settings.lastExportAt, locale, 'datetimeSeconds')}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => void run('test', testFlexiConnection)}
            >
              {busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Перевірити зʼєднання
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">Оновити існуючі</p>
                <p className="text-sm text-muted-foreground">
                  Ті самі дані з дерева ABRA (категорії: назви, Text above/below; товари: описи,
                  ціни, сток, розміри) — лише для сутностей, що вже є на сайті. Нових категорій /
                  товарів / SKU не створює.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={Boolean(busy)}
                onClick={() =>
                  void run('strom-update', async () => {
                    const r = await runFlexiStromSync({ createMissing: false })
                    return { ok: r.ok, message: r.message }
                  })
                }
              >
                {busy === 'strom-update' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Оновити існуючі
              </Button>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-primary/30 p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">Імпорт з ABRA</p>
                <p className="text-sm text-muted-foreground">
                  Створює відсутні категорії / товари / варіанти (нові товари — unpublished) і
                  оновлює існуючі. Для першого завантаження і після нових папок у дереві ABRA.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                disabled={Boolean(busy)}
                onClick={() =>
                  void run('strom-import', async () => {
                    const r = await runFlexiStromSync({ createMissing: true })
                    return { ok: r.ok, message: r.message }
                  })
                }
              >
                {busy === 'strom-import' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Імпорт з ABRA
              </Button>
            </div>
          </div>

          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Ремонт і додатково (журнал / повний прайс)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">Наздогнати журнал змін</p>
                  <p className="text-sm text-muted-foreground">
                    Changes API з курсора — якщо webhook відстав і ви ще не робили ручний знімок
                    вище. Коли webhook живий — рідко потрібно.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run('poll', async () => {
                      const r = await runFlexiPollChanges()
                      return { ok: r.ok, message: r.message }
                    })
                  }
                >
                  {busy === 'poll' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Наздогнати журнал
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">Пройти весь прайс</p>
                  <p className="text-sm text-muted-foreground">
                    Сторінка за сторінкою весь cenik, лише вже існуючі SKU. Довго й витрачає ліміт —
                    зазвичай достатньо «Оновити існуючі». Також є розклад вище.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run('full', async () => {
                      const r = await runFlexiFullSync()
                      return { ok: r.ok, message: r.message }
                    })
                  }
                >
                  {busy === 'full' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Пройти весь прайс
                </Button>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
      <FlexiQueueCard />

      <FormSaveBar onSave={() => void save()} saving={saving} isDirty={isDirty} sticky />
    </div>
  )
}
