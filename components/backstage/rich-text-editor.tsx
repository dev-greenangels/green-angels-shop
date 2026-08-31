'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bold, Italic, List, Pilcrow, Type } from 'lucide-react'

import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  applyRichTextBlockFormat,
  applyRichTextCommand,
  applyRichTextFontSize,
  normalizeRichTextHtml,
  type RichFontSize,
} from '@/lib/backstage/rich-text-html'
import {
  fetchTranslationField,
  patchTranslationField,
} from '@/lib/backstage/translation-fields'
import { LOCALE_FLAGS, SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8 shrink-0"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

function RichTextLocaleSwitcher({
  activeLocale,
  onSelect,
  disabled,
}: {
  activeLocale: AppLocale
  onSelect: (locale: AppLocale) => void
  disabled?: boolean
}) {
  const t = useTranslations('common')

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('contentLocaleAria')}>
      {SUPPORTED_LOCALES.map((item) => {
        const active = item === activeLocale
        return (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (item !== activeLocale) onSelect(item)
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
              active
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/60 hover:text-foreground',
              disabled && 'pointer-events-none opacity-50',
            )}
            aria-pressed={active}
            title={item.toUpperCase()}
          >
            <span aria-hidden className="text-xs leading-none">
              {LOCALE_FLAGS[item]}
            </span>
            {item}
          </button>
        )
      })}
    </div>
  )
}

export function RichTextEditor({
  id: idProp,
  label,
  value,
  onChange,
  placeholder,
  multiLocaleProductId,
}: {
  id?: string
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** When set, locale chips switch description per language (auto-saved on switch). */
  multiLocaleProductId?: string
}) {
  const te = useTranslations('editor')
  const tl = useTranslations('labels')
  const th = useTranslations('hints')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const autoId = useId()
  const id = idProp ?? autoId
  const editorRef = useRef<HTMLDivElement>(null)
  const draftsRef = useRef<Partial<Record<AppLocale, string>>>({})
  const prevContentLocaleRef = useRef<AppLocale>(contentLocale)
  const [editorLocale, setEditorLocale] = useState<AppLocale>(contentLocale)
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [htmlDraft, setHtmlDraft] = useState(value)
  const [localeLoading, setLocaleLoading] = useState(false)
  const resolvedLabel = label ?? tl('description')
  const resolvedPlaceholder = placeholder ?? th('productDescriptionPlaceholder')

  const fontSizes: Array<{ label: string; value: RichFontSize }> = [
    { label: te('fontSmall'), value: 'sm' },
    { label: te('fontNormal'), value: 'base' },
    { label: te('fontMedium'), value: 'lg' },
    { label: te('fontLarge'), value: 'xl' },
  ]

  useEffect(() => {
    if (!contentLocaleReady) return
    draftsRef.current[contentLocale] = value
    setHtmlDraft(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount sync only
  }, [contentLocaleReady])

  useEffect(() => {
    if (prevContentLocaleRef.current === contentLocale) return
    prevContentLocaleRef.current = contentLocale
    draftsRef.current[contentLocale] = value
    setEditorLocale(contentLocale)
    setHtmlDraft(value)
  }, [contentLocale, value])

  useEffect(() => {
    if (!multiLocaleProductId) {
      return
    }

    let cancelled = false
    setLocaleLoading(true)
    void fetchTranslationField({
      kind: 'product-description',
      productId: multiLocaleProductId,
    })
      .then((translations) => {
        if (cancelled) return
        draftsRef.current = {
          ...translations,
          [contentLocale]: value || translations[contentLocale] || '',
        }
        setHtmlDraft(draftsRef.current[editorLocale] ?? draftsRef.current[contentLocale] ?? '')
      })
      .finally(() => {
        if (!cancelled) setLocaleLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [multiLocaleProductId])

  const syncVisualFromDraft = (html: string) => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html
    }
  }

  useLayoutEffect(() => {
    if (mode !== 'visual') return
    syncVisualFromDraft(htmlDraft)
  }, [mode, htmlDraft])

  const readCurrentHtml = useCallback(() => {
    const raw =
      mode === 'visual'
        ? (editorRef.current?.innerHTML ?? htmlDraft)
        : htmlDraft
    return normalizeRichTextHtml(raw)
  }, [mode, htmlDraft])

  const commitHtml = useCallback(
    (raw: string, locale = editorLocale) => {
      const normalized = normalizeRichTextHtml(raw)
      draftsRef.current[locale] = normalized
      setHtmlDraft(normalized)
      syncVisualFromDraft(normalized)
      if (locale === contentLocale) {
        onChange(normalized)
      }
      return normalized
    },
    [contentLocale, editorLocale, onChange],
  )

  const syncFromEditor = () => {
    if (!editorRef.current) return
    commitHtml(editorRef.current.innerHTML)
  }

  const switchEditorLocale = async (nextLocale: AppLocale) => {
    if (nextLocale === editorLocale || localeLoading) return

    const currentHtml = readCurrentHtml()
    draftsRef.current[editorLocale] = currentHtml

    if (multiLocaleProductId) {
      setLocaleLoading(true)
      try {
        await patchTranslationField(
          { kind: 'product-description', productId: multiLocaleProductId },
          { [editorLocale]: currentHtml },
        )
        toast.success(te('localeSaved', { locale: editorLocale.toUpperCase() }))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : te('localeSaveFailed'))
        return
      } finally {
        setLocaleLoading(false)
      }
    }

    const nextHtml = draftsRef.current[nextLocale] ?? ''
    setEditorLocale(nextLocale)
    setHtmlDraft(nextHtml)
    syncVisualFromDraft(nextHtml)
    if (nextLocale === contentLocale) {
      onChange(nextHtml)
    }
  }

  const applyBlockFormat = () => {
    if (!editorRef.current) return
    applyRichTextBlockFormat(editorRef.current, 'p')
    syncFromEditor()
  }

  const applyInlineCommand = (command: 'bold' | 'italic' | 'insertUnorderedList') => {
    if (!editorRef.current) return
    applyRichTextCommand(editorRef.current, command)
    syncFromEditor()
  }

  const applyFontSize = (size: RichFontSize) => {
    if (!editorRef.current) return
    applyRichTextFontSize(editorRef.current, size)
    syncFromEditor()
  }

  const showLocaleSwitcher = Boolean(multiLocaleProductId && contentLocaleReady)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{resolvedLabel}</Label>

      <Tabs
        value={mode}
        onValueChange={(next) => {
          if (next === 'html') {
            const latest = readCurrentHtml()
            setHtmlDraft(latest)
            commitHtml(latest)
          } else if (next === 'visual') {
            commitHtml(htmlDraft)
          }
          setMode(next as 'visual' | 'html')
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <TabsList className="grid h-9 w-full max-w-xs grid-cols-2 sm:w-auto">
            <TabsTrigger value="visual">{te('tabVisual')}</TabsTrigger>
            <TabsTrigger value="html">{te('tabHtml')}</TabsTrigger>
          </TabsList>
          {showLocaleSwitcher ? (
            <RichTextLocaleSwitcher
              activeLocale={editorLocale}
              onSelect={(next) => void switchEditorLocale(next)}
              disabled={localeLoading}
            />
          ) : null}
        </div>
        {showLocaleSwitcher ? (
          <p className="text-xs text-muted-foreground">{th('localeSwitchAutoSave')}</p>
        ) : null}

        <TabsContent value="visual" forceMount className="mt-3 space-y-0 data-[state=inactive]:hidden">
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/40 p-1">
            <ToolbarButton onClick={() => applyInlineCommand('bold')} label={te('bold')}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => applyInlineCommand('italic')} label={te('italic')}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={applyBlockFormat} label={te('paragraph')}>
              <Pilcrow className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => applyInlineCommand('insertUnorderedList')} label={te('list')}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <div className="mx-1 h-6 w-px bg-border" />
            <div className="flex items-center gap-1 px-1">
              <Type className="h-4 w-4 text-muted-foreground" aria-hidden />
              <select
                className="h-8 rounded-md border border-border/80 bg-background px-2 text-xs shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                defaultValue="base"
                onChange={(e) => applyFontSize(e.target.value as RichFontSize)}
                aria-label={te('fontSize')}
              >
                {fontSizes.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            ref={editorRef}
            id={id}
            role="textbox"
            aria-multiline
            contentEditable
            suppressContentEditableWarning
            data-placeholder={resolvedPlaceholder}
            className={cn(
              'rich-text-content min-h-[220px] rounded-b-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
              localeLoading && 'opacity-60',
            )}
            onInput={syncFromEditor}
            onBlur={syncFromEditor}
          />
        </TabsContent>

        <TabsContent value="html" className="mt-3">
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            onBlur={() => commitHtml(htmlDraft)}
            rows={12}
            className="font-mono text-xs"
            placeholder={th('htmlPlaceholder')}
            spellCheck={false}
            disabled={localeLoading}
          />
          <p className="mt-2 text-xs text-muted-foreground">{th('htmlHint')}</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
