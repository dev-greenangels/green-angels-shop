'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  Pilcrow,
  Type,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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

export function RichTextEditor({
  id: idProp,
  label,
  value,
  onChange,
  placeholder,
}: {
  id?: string
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const te = useTranslations('editor')
  const tl = useTranslations('labels')
  const th = useTranslations('hints')
  const fontSizes = useMemo(
    () => [
      { label: te('fontSmall'), value: '2' },
      { label: te('fontNormal'), value: '3' },
      { label: te('fontMedium'), value: '4' },
      { label: te('fontLarge'), value: '5' },
    ],
    [te],
  )
  const autoId = useId()
  const id = idProp ?? autoId
  const editorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [htmlDraft, setHtmlDraft] = useState(value)
  const resolvedLabel = label ?? tl('description')
  const resolvedPlaceholder = placeholder ?? th('productDescriptionPlaceholder')

  useEffect(() => {
    setHtmlDraft(value)
    if (mode === 'visual' && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value, mode])

  const syncFromEditor = () => {
    const html = editorRef.current?.innerHTML ?? ''
    onChange(html)
    setHtmlDraft(html)
  }

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    syncFromEditor()
  }

  const applyHtml = () => {
    onChange(htmlDraft)
    if (editorRef.current) editorRef.current.innerHTML = htmlDraft
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{resolvedLabel}</Label>
      <Tabs
        value={mode}
        onValueChange={(next) => {
          if (next === 'html') {
            setHtmlDraft(editorRef.current?.innerHTML ?? value)
          } else if (next === 'visual') {
            applyHtml()
          }
          setMode(next as 'visual' | 'html')
        }}
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="visual">{te('tabVisual')}</TabsTrigger>
          <TabsTrigger value="html">{te('tabHtml')}</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-3 space-y-0">
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/40 p-1">
            <ToolbarButton onClick={() => exec('bold')} label={te('bold')}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec('italic')} label={te('italic')}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec('formatBlock', 'p')} label={te('paragraph')}>
              <Pilcrow className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec('formatBlock', 'h2')} label={te('heading2')}>
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec('formatBlock', 'h3')} label={te('heading3')}>
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec('insertUnorderedList')} label={te('list')}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <div className="mx-1 h-6 w-px bg-border" />
            <div className="flex items-center gap-1 px-1">
              <Type className="h-4 w-4 text-muted-foreground" aria-hidden />
              <select
                className="h-8 rounded-md border border-border/80 bg-background px-2 text-xs shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                defaultValue="3"
                onChange={(e) => exec('fontSize', e.target.value)}
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
              'min-h-[220px] rounded-b-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
              '[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold',
              '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold',
              '[&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5'
            )}
            onInput={syncFromEditor}
            onBlur={syncFromEditor}
          />
        </TabsContent>

        <TabsContent value="html" className="mt-3">
          <Textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            onBlur={applyHtml}
            rows={12}
            className="font-mono text-xs"
            placeholder={th('htmlPlaceholder')}
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-muted-foreground">{th('htmlHint')}</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
