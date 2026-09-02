'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Loader2, Save } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TranslationLocaleLabel } from '@/components/backstage/content-locale-banner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import backstageDeMessages from '@/messages/backstage/de.json'
import backstageEnMessages from '@/messages/backstage/en.json'
import backstageHuMessages from '@/messages/backstage/hu.json'
import backstageSkMessages from '@/messages/backstage/sk.json'
import backstageUkMessages from '@/messages/backstage/uk.json'
import csMessages from '@/messages/cs.json'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'
import huMessages from '@/messages/hu.json'
import skMessages from '@/messages/sk.json'
import ukMessages from '@/messages/uk.json'
import {
  buildMessageOverridesTree,
  flattenMessageStrings,
  getMessageByPath,
} from '@/lib/i18n/merge-messages'
import { LOCALE_FLAGS, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale, type LocalizationSettings } from '@/lib/i18n/locales'
import {
  NAMESPACE_LABELS,
  namespaceForKey,
  TRANSLATION_SECTIONS,
  type TranslationArea,
} from '@/lib/i18n/translation-sections'
import { cn } from '@/lib/utils'

type EditableEntry = {
  key: string
  defaults: Record<AppLocale, string>
  values: Record<AppLocale, string>
}

const BASE_MESSAGES_BY_LOCALE: Record<AppLocale, Record<string, unknown>> = {
  uk: {
    ...(ukMessages as Record<string, unknown>),
    backstage: backstageUkMessages as Record<string, unknown>,
  },
  en: {
    ...(enMessages as Record<string, unknown>),
    backstage: backstageEnMessages as Record<string, unknown>,
  },
  sk: {
    ...(skMessages as Record<string, unknown>),
    backstage: backstageSkMessages as Record<string, unknown>,
  },
  hu: {
    ...(huMessages as Record<string, unknown>),
    backstage: backstageHuMessages as Record<string, unknown>,
  },
  de: {
    ...(deMessages as Record<string, unknown>),
    backstage: backstageDeMessages as Record<string, unknown>,
  },
  cs: {
    ...(csMessages as Record<string, unknown>),
    backstage: backstageEnMessages as Record<string, unknown>,
  },
}

function buildEditableEntries(settings: LocalizationSettings): EditableEntry[] {
  const flatByLocale = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      flattenMessageStrings(BASE_MESSAGES_BY_LOCALE[locale]),
    ]),
  ) as Record<AppLocale, Array<{ key: string; value: string }>>

  const ukKeys = flatByLocale.uk.map((entry) => entry.key)

  return ukKeys.map((key) => {
    const defaults = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => {
        const match = flatByLocale[locale].find((entry) => entry.key === key)
        return [locale, match?.value ?? '']
      }),
    ) as Record<AppLocale, string>

    const values = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [
        locale,
        getMessageByPath(settings.messageOverrides[locale] ?? {}, key) ?? defaults[locale],
      ]),
    ) as Record<AppLocale, string>

    return { key, defaults, values }
  })
}

function buildSettingsFromEntries(
  entries: EditableEntry[],
  base: Pick<LocalizationSettings, 'showLanguageSwitcher' | 'showFaqInFooter' | 'availableLocales'>,
): LocalizationSettings {
  const messageOverrides = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      buildMessageOverridesTree(
        entries.map((entry) => ({ key: entry.key, value: entry.values[locale] })),
        BASE_MESSAGES_BY_LOCALE[locale],
      ),
    ]),
  ) as LocalizationSettings['messageOverrides']

  return {
    showLanguageSwitcher: base.showLanguageSwitcher,
    showFaqInFooter: base.showFaqInFooter,
    availableLocales: base.availableLocales,
    messageOverrides,
  }
}

function TranslationEntryRow({
  entry,
  onUpdate,
  onReset,
}: {
  entry: EditableEntry
  onUpdate: (key: string, locale: AppLocale, value: string) => void
  onReset: (key: string, locale: AppLocale) => void
}) {
  const tCommon = useTranslations('common')
  return (
    <div className="rounded-md border-2 border-border/80 bg-background p-3 shadow-sm">
      <p className="mb-2 font-mono text-xs font-medium text-muted-foreground">{entry.key}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SUPPORTED_LOCALES.map((locale) => {
          const value = entry.values[locale]
          const defaultValue = entry.defaults[locale]
          const isCustom = value.trim() !== defaultValue.trim()
          return (
            <div key={locale} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <TranslationLocaleLabel locale={locale} />
                {isCustom ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onReset(entry.key, locale)}
                  >
                    {tCommon('reset')}
                  </Button>
                ) : null}
              </div>
              {value.length > 80 || value.includes('\n') ? (
                <Textarea
                  rows={3}
                  className="border-2 border-input bg-background"
                  value={value}
                  onChange={(event) => onUpdate(entry.key, locale, event.target.value)}
                />
              ) : (
                <Input
                  className="border-2 border-input bg-background"
                  value={value}
                  onChange={(event) => onUpdate(entry.key, locale, event.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NamespaceGroup({
  namespace,
  entries,
  open,
  onOpenChange,
  onUpdate,
  onReset,
}: {
  namespace: string
  entries: EditableEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (key: string, locale: AppLocale, value: string) => void
  onReset: (key: string, locale: AppLocale) => void
}) {
  const tCommon = useTranslations('common')
  const customCount = entries.filter((e) =>
    SUPPORTED_LOCALES.some((locale) => e.values[locale].trim() !== e.defaults[locale].trim()),
  ).length

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {NAMESPACE_LABELS[namespace] ?? namespace}
          </p>
          <p className="text-xs text-muted-foreground">{tCommon('rows', { count: entries.length })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {customCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {tCommon('customCount', { count: customCount })}
            </span>
          ) : null}
          <ChevronDown
            className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-1 pt-2">
        {entries.map((entry) => (
          <TranslationEntryRow key={entry.key} entry={entry} onUpdate={onUpdate} onReset={onReset} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function TranslationAreaEditor({
  area,
  entries,
  filter,
  expandedSections,
  expandedNamespaces,
  onSectionOpenChange,
  onNamespaceOpenChange,
  onUpdate,
  onReset,
}: {
  area: TranslationArea
  entries: EditableEntry[]
  filter: string
  expandedSections: Record<string, boolean>
  expandedNamespaces: Record<string, boolean>
  onSectionOpenChange: (id: string, open: boolean) => void
  onNamespaceOpenChange: (key: string, open: boolean) => void
  onUpdate: (key: string, locale: AppLocale, value: string) => void
  onReset: (key: string, locale: AppLocale) => void
}) {
  const tCommon = useTranslations('common')
  const tHints = useTranslations('hints')
  const sections = TRANSLATION_SECTIONS.filter((s) => s.area === area)

  const sectionData = useMemo(() => {
    return sections
      .map((section) => {
        const sectionEntries = entries.filter((entry) => {
          const ns = namespaceForKey(entry.key)
          return section.namespaces.includes(ns)
        })
        if (sectionEntries.length === 0) return null

        const byNamespace = new Map<string, EditableEntry[]>()
        for (const entry of sectionEntries) {
          const ns = namespaceForKey(entry.key)
          const list = byNamespace.get(ns) ?? []
          list.push(entry)
          byNamespace.set(ns, list)
        }

        return {
          section,
          namespaces: [...byNamespace.entries()].sort(([a], [b]) => a.localeCompare(b, 'uk')),
          total: sectionEntries.length,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [entries, sections])

  if (sectionData.length === 0) {
    return (
      <p className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        {filter.trim() ? tHints('noSearchResults') : tHints('noSectionRows')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {sectionData.map(({ section, namespaces, total }) => {
        const sectionOpen = expandedSections[section.id] ?? false
        return (
          <Collapsible
            key={section.id}
            open={sectionOpen}
            onOpenChange={(open) => onSectionOpenChange(section.id, open)}
          >
            <div className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm">
              <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-foreground">{section.label}</p>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tCommon('rowsAndGroups', { rows: total, groups: namespaces.length })}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                    sectionOpen && 'rotate-180',
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 border-t-2 border-border bg-muted/10 px-4 py-4">
                {namespaces.map(([namespace, nsEntries]) => {
                  const nsKey = `${section.id}:${namespace}`
                  return (
                    <NamespaceGroup
                      key={nsKey}
                      namespace={namespace}
                      entries={nsEntries}
                      open={expandedNamespaces[nsKey] ?? false}
                      onOpenChange={(open) => onNamespaceOpenChange(nsKey, open)}
                      onUpdate={onUpdate}
                      onReset={onReset}
                    />
                  )
                })}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}

export function LocalizationSettingsForm({
  settings,
  onChange,
  onSave,
  saving,
  isDirty = false,
}: {
  settings: LocalizationSettings
  onChange: (next: LocalizationSettings) => void
  onSave: () => void
  saving: boolean
  isDirty?: boolean
}) {
  const tPages = useTranslations('pages.localization')
  const tActions = useTranslations('actions')
  const tHints = useTranslations('hints')
  const [filter, setFilter] = useState('')
  const [translationTab, setTranslationTab] = useState<TranslationArea>('storefront')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedNamespaces, setExpandedNamespaces] = useState<Record<string, boolean>>({})

  const entries = useMemo(() => buildEditableEntries(settings), [settings])

  const filteredEntries = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return entries
    return entries.filter(
      (entry) =>
        entry.key.toLowerCase().includes(query) ||
        SUPPORTED_LOCALES.some((locale) => entry.values[locale].toLowerCase().includes(query)),
    )
  }, [entries, filter])

  const storefrontEntries = useMemo(
    () => filteredEntries.filter((e) => !e.key.startsWith('backstage.')),
    [filteredEntries],
  )
  const backstageEntries = useMemo(
    () => filteredEntries.filter((e) => e.key.startsWith('backstage.')),
    [filteredEntries],
  )

  const expandMatching = useCallback((areaEntries: EditableEntry[]) => {
    if (!filter.trim()) return
    const nextSections: Record<string, boolean> = {}
    const nextNamespaces: Record<string, boolean> = {}
    for (const entry of areaEntries) {
      const ns = namespaceForKey(entry.key)
      const section = TRANSLATION_SECTIONS.find(
        (s) => s.namespaces.includes(ns) && s.area === (entry.key.startsWith('backstage.') ? 'backstage' : 'storefront'),
      )
      if (section) {
        nextSections[section.id] = true
        nextNamespaces[`${section.id}:${ns}`] = true
      }
    }
    setExpandedSections((prev) => ({ ...prev, ...nextSections }))
    setExpandedNamespaces((prev) => ({ ...prev, ...nextNamespaces }))
  }, [filter])

  useEffect(() => {
    expandMatching(translationTab === 'storefront' ? storefrontEntries : backstageEntries)
  }, [expandMatching, translationTab, storefrontEntries, backstageEntries])

  const settingsBase = useMemo(
    () => ({
      showLanguageSwitcher: settings.showLanguageSwitcher,
      showFaqInFooter: settings.showFaqInFooter,
      availableLocales: settings.availableLocales,
    }),
    [settings.showLanguageSwitcher, settings.showFaqInFooter, settings.availableLocales],
  )

  const updateEntry = (key: string, locale: AppLocale, value: string) => {
    const nextEntries = buildEditableEntries(settings).map((entry) => {
      if (entry.key !== key) return entry
      return { ...entry, values: { ...entry.values, [locale]: value } }
    })
    onChange(buildSettingsFromEntries(nextEntries, settingsBase))
  }

  const resetEntry = (key: string, locale: AppLocale) => {
    const nextEntries = buildEditableEntries(settings).map((entry) => {
      if (entry.key !== key) return entry
      return { ...entry, values: { ...entry.values, [locale]: entry.defaults[locale] } }
    })
    onChange(buildSettingsFromEntries(nextEntries, settingsBase))
  }

  const toggleAvailableLocale = (locale: AppLocale, checked: boolean) => {
    const current = settings.availableLocales
    const next = checked
      ? current.includes(locale)
        ? current
        : [...current, locale]
      : current.filter((item) => item !== locale)

    if (next.length === 0) return

    onChange({ ...settings, availableLocales: next })
  }

  const handleSectionOpenChange = (id: string, open: boolean) => {
    setExpandedSections((prev) => ({ ...prev, [id]: open }))
  }

  const handleNamespaceOpenChange = (key: string, open: boolean) => {
    setExpandedNamespaces((prev) => ({ ...prev, [key]: open }))
  }

  const collapseAll = () => {
    setExpandedSections({})
    setExpandedNamespaces({})
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border shadow-sm">
        <CardHeader>
          <CardTitle>{tPages('siteLanguagesTitle')}</CardTitle>
          <CardDescription>{tPages('siteLanguagesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="show-language-switcher">{tPages('showSwitcherLabel')}</Label>
              <p className="text-sm text-muted-foreground">{tPages('showSwitcherHint')}</p>
            </div>
            <Switch
              id="show-language-switcher"
              checked={settings.showLanguageSwitcher}
              onCheckedChange={(checked) =>
                onChange({ ...settings, showLanguageSwitcher: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t-2 border-border pt-6">
            <div className="space-y-1">
              <Label htmlFor="show-faq-in-footer">{tPages('showFaqInFooterLabel')}</Label>
              <p className="text-sm text-muted-foreground">{tPages('showFaqInFooterHint')}</p>
            </div>
            <Switch
              id="show-faq-in-footer"
              checked={settings.showFaqInFooter}
              onCheckedChange={(checked) => onChange({ ...settings, showFaqInFooter: checked })}
            />
          </div>

          <div className="space-y-3 border-t-2 border-border pt-6">
            <div className="space-y-1">
              <Label>{tPages('availableLocalesLabel')}</Label>
              <p className="text-sm text-muted-foreground">{tPages('availableLocalesHint')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPPORTED_LOCALES.map((locale) => {
                const checked = settings.availableLocales.includes(locale)
                const isLast = checked && settings.availableLocales.length === 1
                return (
                  <label
                    key={locale}
                    htmlFor={`available-locale-${locale}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40',
                      checked && 'border-primary/40 bg-primary/5',
                      isLast && 'cursor-not-allowed opacity-70',
                    )}
                  >
                    <Checkbox
                      id={`available-locale-${locale}`}
                      checked={checked}
                      disabled={isLast}
                      onCheckedChange={(value) => toggleAvailableLocale(locale, value === true)}
                    />
                    <span className="text-lg leading-none" aria-hidden>
                      {LOCALE_FLAGS[locale]}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">{LOCALE_LABELS[locale]}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader>
          <CardTitle>{tPages('catalogContentTitle')}</CardTitle>
          <CardDescription>{tPages('catalogContentDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{tPages('catalogContentHint1')}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{tPages('catalogContentHint2')}</li>
            <li>{tPages('catalogContentHint3')}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>{tPages('uiStringsTitle')}</CardTitle>
            <CardDescription>{tPages('uiStringsDesc')}</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={translationTab}
              onValueChange={(value) => setTranslationTab(value as TranslationArea)}
            >
              <TabsList className="h-10 border-2 border-border bg-muted/50 p-1">
                <TabsTrigger value="storefront" className="px-4">
                  {tPages('tabStorefront')}
                </TabsTrigger>
                <TabsTrigger value="backstage" className="px-4">
                  {tPages('tabBackstage')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-1 flex-col gap-2 sm:max-w-sm sm:flex-row sm:items-center">
              <Input
                id="translation-filter"
                placeholder={tHints('searchKeyOrText')}
                className="border-2 border-input bg-background"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              <Button type="button" variant="outline" className="shrink-0 border-2" onClick={collapseAll}>
                {tActions('collapseAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {translationTab === 'storefront' ? (
            <TranslationAreaEditor
              area="storefront"
              entries={storefrontEntries}
              filter={filter}
              expandedSections={expandedSections}
              expandedNamespaces={expandedNamespaces}
              onSectionOpenChange={handleSectionOpenChange}
              onNamespaceOpenChange={handleNamespaceOpenChange}
              onUpdate={updateEntry}
              onReset={resetEntry}
            />
          ) : (
            <div className="space-y-4">
              <TranslationAreaEditor
                area="backstage"
                entries={backstageEntries}
                filter={filter}
                expandedSections={expandedSections}
                expandedNamespaces={expandedNamespaces}
                onSectionOpenChange={handleSectionOpenChange}
                onNamespaceOpenChange={handleNamespaceOpenChange}
                onUpdate={updateEntry}
                onReset={resetEntry}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="button" onClick={onSave} disabled={saving || !isDirty} className="border-2 border-primary/20">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {tActions('saveLocalization')}
      </Button>
    </div>
  )
}
