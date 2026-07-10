'use client'

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Loader2, Mic, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/i18n/navigation'
import {
  EMPTY_SEARCH_SUGGEST,
  SEARCH_SUGGEST_MIN_LENGTH,
  buildSearchPageHref,
  fetchSearchSuggestions,
  type SearchSuggestResult,
} from '@/lib/catalog/search-suggest'
import { categoryHref, productHref } from '@/lib/catalog/paths'
import { cn } from '@/lib/utils'

type SiteSearchPanelVariant = 'default' | 'header'

type SiteSearchFieldProps = {
  value: string
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  placeholder: string
  onFocus?: () => void
  onBlur?: () => void
  onClear?: () => void
  onNavigate?: () => void
  className?: string
  inputClassName?: string
  panelVariant?: SiteSearchPanelVariant
}

type PanelLayout = {
  top: number
  left: number
  width: number
}

function computePanelLayout(
  anchor: DOMRect,
  variant: SiteSearchPanelVariant,
): PanelLayout {
  if (variant === 'header') {
    const width = Math.min(window.innerWidth - 24, 44 * 16)
    const idealLeft = anchor.left + anchor.width / 2 - width / 2
    const left = Math.max(12, Math.min(idealLeft, window.innerWidth - width - 12))
    return { top: anchor.bottom + 8, left, width }
  }

  const width = Math.min(anchor.width, window.innerWidth - 32)
  const left = Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16))
  return { top: anchor.bottom + 6, left, width }
}

export function SiteSearchField({
  value,
  onChange,
  inputRef,
  placeholder,
  onFocus,
  onBlur,
  onClear,
  onNavigate,
  className,
  inputClassName,
  panelVariant = 'default',
}: SiteSearchFieldProps) {
  const t = useTranslations('search')
  const tc = useTranslations('common')
  const router = useRouter()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchSuggestResult>(EMPTY_SEARCH_SUGGEST)
  const [mounted, setMounted] = useState(false)
  const [panelLayout, setPanelLayout] = useState<PanelLayout | null>(null)

  const trimmed = value.trim()
  const showPanel = isFocused && trimmed.length >= SEARCH_SUGGEST_MIN_LENGTH
  const showClear = trimmed.length > 0
  const isHeaderPanel = panelVariant === 'header'

  const updatePanelLayout = useCallback(() => {
    if (!containerRef.current) return
    setPanelLayout(computePanelLayout(containerRef.current.getBoundingClientRect(), panelVariant))
  }, [panelVariant])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showPanel) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.setAttribute('data-scroll-locked', 'true')

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.removeAttribute('data-scroll-locked')
    }
  }, [showPanel])

  useEffect(() => {
    if (!showPanel) {
      setPanelLayout(null)
      return
    }

    updatePanelLayout()
    window.addEventListener('resize', updatePanelLayout)
    window.addEventListener('scroll', updatePanelLayout, true)

    return () => {
      window.removeEventListener('resize', updatePanelLayout)
      window.removeEventListener('scroll', updatePanelLayout, true)
    }
  }, [showPanel, updatePanelLayout])

  useEffect(() => {
    if (!showPanel) {
      setResult(EMPTY_SEARCH_SUGGEST)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const timer = window.setTimeout(() => {
      void fetchSearchSuggestions(trimmed)
        .then((data) => {
          if (!cancelled) setResult(data)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [showPanel, trimmed])

  const navigateTo = (href: string) => {
    onNavigate?.()
    setIsFocused(false)
    router.push(href)
  }

  const handleSubmit = () => {
    if (!trimmed) return
    navigateTo(buildSearchPageHref(trimmed))
  }

  const handleClear = () => {
    onChange('')
    onClear?.()
    inputRef?.current?.focus()
  }

  const closePanel = () => {
    setIsFocused(false)
    inputRef?.current?.blur()
    onBlur?.()
  }

  const handleBlur = () => {
    window.setTimeout(() => {
      const active = document.activeElement
      if (containerRef.current?.contains(active)) return
      setIsFocused(false)
      onBlur?.()
    }, 120)
  }

  const hasResults =
    result.suggestions.length > 0 || result.categories.length > 0 || result.products.length > 0

  const panelContent = showPanel && panelLayout ? (
    <div
      id={listboxId}
      role="listbox"
      style={{
        position: 'fixed',
        top: panelLayout.top,
        left: panelLayout.left,
        width: panelLayout.width,
      }}
      className={cn(
        'z-50 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg',
        isHeaderPanel
          ? 'max-h-[min(72vh,36rem)] p-4'
          : 'max-h-[min(70vh,28rem)] p-3',
      )}
      onMouseDown={(event) => event.preventDefault()}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {tc('searching')}
        </div>
      ) : null}

      {!loading && !hasResults ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{tc('nothingFound')}</p>
      ) : null}

      {!loading && result.suggestions.length > 0 ? (
        <section className="space-y-1">
          <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('suggestions')}
          </h3>
          <ul className="space-y-0.5">
            {result.suggestions.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/70"
                  onClick={() => navigateTo(item.href)}
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && result.categories.length > 0 ? (
        <section className={cn(result.suggestions.length > 0 && 'mt-4', 'space-y-1')}>
          <h3 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('categories')}
          </h3>
          {isHeaderPanel ? (
            <ul className="grid grid-cols-2 gap-1.5">
              {result.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={categoryHref(category.slug)}
                    className="flex h-full items-center gap-2 rounded-lg border border-border/40 px-2 py-2 text-sm transition-colors hover:bg-muted/70"
                    onClick={() => onNavigate?.()}
                  >
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="28px"
                      />
                    </div>
                    <span className="line-clamp-2 text-xs leading-snug">{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-0.5">
              {result.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={categoryHref(category.slug)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/70"
                    onClick={() => onNavigate?.()}
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </div>
                    <span className="line-clamp-2">{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {!loading && result.products.length > 0 ? (
        <section
          className={cn(
            (result.suggestions.length > 0 || result.categories.length > 0) && 'mt-4',
            isHeaderPanel && 'space-y-2',
          )}
        >
          <h3
            className={cn(
              'px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground',
              isHeaderPanel && 'mb-0 px-1',
            )}
          >
            {t('products')}
          </h3>
          {isHeaderPanel ? (
            <ul className="space-y-1">
              {result.products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={productHref(product.categorySlug, product.slug)}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-2 transition-colors hover:bg-muted/70"
                    onClick={() => onNavigate?.()}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[4.5rem] sm:w-[4.5rem]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                    <span className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
                      {product.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {result.products.map((product) => (
                <Link
                  key={product.id}
                  href={productHref(product.categorySlug, product.slug)}
                  className="flex flex-col gap-1.5 rounded-lg border border-border/50 p-2 transition-colors hover:bg-muted/50"
                  onClick={() => onNavigate?.()}
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="40vw"
                    />
                  </div>
                  <span className="line-clamp-2 text-xs leading-snug text-foreground">
                    {product.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  ) : null

  return (
    <>
      {mounted && showPanel
        ? createPortal(
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
              onMouseDown={(event) => {
                event.preventDefault()
                closePanel()
              }}
            />,
            document.body,
          )
        : null}

      {mounted && panelContent ? createPortal(panelContent, document.body) : null}

      <div ref={containerRef} className={cn('relative z-50', className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listboxId : undefined}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            setIsFocused(true)
            onFocus?.()
          }}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
            if (event.key === 'Escape') {
              closePanel()
            }
          }}
          className={cn(
            'h-9 w-full pl-9 text-base',
            showClear ? 'pr-16' : 'pr-10',
            inputClassName,
          )}
        />
        {showClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-9 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t('clearSearch')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground"
          aria-label={t('voiceSearch')}
          disabled
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
