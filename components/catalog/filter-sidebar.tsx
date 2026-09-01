'use client'

import { type CSSProperties } from 'react'
import { Filter, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  CatalogFilterOptionLabel,
  CatalogFilterSectionTitle,
} from '@/components/catalog/catalog-filter-option-label'
import { CatalogActiveFilters } from '@/components/catalog/catalog-active-filters'
import { CatalogPriceFilter } from '@/components/catalog/catalog-price-filter'
import { CatalogContainerFilterValues } from '@/components/catalog/catalog-container-filter-values'
import { useStickyToolbarOptional } from '@/components/layout/sticky-toolbar-shell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import {
  countActiveCatalogFilters,
  toggleCatalogFilterValue,
  type CatalogFilters,
} from '@/lib/catalog/filter-plants'
import {
  catalogFilterPanelDefaultMaxHeightClassName,
  catalogSidebarPanelClassName,
  catalogSidebarScrollBodyClassName,
  catalogSidebarScrollClassName,
  catalogSidebarWidthClassName,
  plantsSidebarMaxHeightClassName,
  plantsSidebarStickyTopClassName,
} from '@/lib/catalog/sidebar-panel-styles'
import {
  applyCatalogFiltersVisibility,
  type CatalogFiltersVisibilitySettings,
} from '@/lib/catalog/filter-visibility'
import {
  useCatalogFilterDefinitions,
  type CatalogFilterScope,
} from '@/lib/catalog/use-catalog-filter-definitions'
import { useDefaultCurrency } from '@/components/providers/commerce-provider'
import { cn } from '@/lib/utils'

export type CatalogFiltersState = CatalogFilters

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <section className="space-y-3 border-b border-border/60 pb-4">
        <Skeleton className="h-4 w-14" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </section>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 border-b border-border/40 pb-3 last:border-0">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[84%]" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface FilterSidebarProps {
  filters: CatalogFiltersState
  onFilterChange: (filters: CatalogFiltersState) => void
  filterScope?: CatalogFilterScope
  filterVisibility?: CatalogFiltersVisibilitySettings
  filterDefinitionsOptions?: {
    initialDefinitions?: CatalogFilterDefinitions
    initialFetchKey?: string
  }
  /** Липкий сайдбар при скролі (сторінка «Рослини А-Я») */
  sticky?: boolean
  /** Висота панелі за вмістом, без зайвого порожнього місця */
  fitContent?: boolean
  /** Розгорнути секцію «Контейнер» за замовчуванням */
  expandContainerByDefault?: boolean
  /** Згорнути групи типів упаковки всередині «Контейнер» */
  collapseContainerGroupsByDefault?: boolean
}

export function FilterSidebarContent({
  filters,
  onFilterChange,
  filterScope,
  filterVisibility,
  filterDefinitionsOptions,
  fitContent = false,
  expandContainerByDefault = false,
  collapseContainerGroupsByDefault = false,
}: FilterSidebarProps) {
  const t = useTranslations('filter')
  const currency = useDefaultCurrency()
  const { definitions, priceBounds, loading, isRefreshing } = useCatalogFilterDefinitions(
    filterScope,
    filters,
    filterDefinitionsOptions,
  )

  if (loading || !definitions) {
    return <FilterSidebarSkeleton />
  }

  const visibleDefinitions = filterVisibility
    ? applyCatalogFiltersVisibility(definitions, filterVisibility)
    : definitions
  const showPrice = filterVisibility?.price ?? true

  const defaultAccordionValue = expandContainerByDefault
    ? visibleDefinitions.variantAttributes
        .filter((attribute) => attribute.valueType === 'CONTAINER' || attribute.slug === 'konteyner')
        .map((attribute) => `attr-${attribute.slug}`)
    : []

  return (
    <div className="relative">
      {isRefreshing ? (
        <div
          className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-background/55 pt-10 backdrop-blur-[1px]"
          aria-hidden
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : null}

      <div
        className={cn(
          'space-y-4 transition-opacity duration-200',
          isRefreshing && 'pointer-events-none opacity-60',
        )}
        aria-busy={isRefreshing}
      >
      {showPrice ? (
      <section className="space-y-3 border-b border-border/60 pb-4">
        <h3 className="text-sm font-semibold">
          {t('price')}
          <span className="ml-1.5 font-normal text-muted-foreground">({currency.symbol})</span>
        </h3>
        <CatalogPriceFilter
          filters={filters}
          bounds={priceBounds}
          onFilterChange={onFilterChange}
        />
      </section>
      ) : null}

      <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full">
        {visibleDefinitions.variantAttributes.map((attribute) => {
          const isContainer =
            attribute.valueType === 'CONTAINER' || attribute.slug === 'konteyner'

          return (
          <AccordionItem key={attribute.id} value={`attr-${attribute.slug}`}>
            <AccordionTrigger className="text-sm font-semibold">
              <CatalogFilterSectionTitle name={attribute.name} icon={attribute.icon} />
            </AccordionTrigger>
            <AccordionContent>
              {isContainer ? (
                <CatalogContainerFilterValues
                  attribute={attribute}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  collapseGroups={collapseContainerGroupsByDefault}
                  fitContent={fitContent}
                />
              ) : (
              <div
                className={cn(
                  'space-y-3 pt-2',
                  !fitContent && 'max-h-52 overflow-y-auto overscroll-contain pr-0.5',
                  !fitContent && catalogSidebarScrollClassName,
                )}
              >
                {attribute.values.map((value) => {
                  const checked = filters.variantAttributes[attribute.slug]?.includes(value.slug) ?? false
                  return (
                    <div key={value.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.slug}-${value.slug}`}
                        checked={checked}
                        onCheckedChange={() =>
                          onFilterChange(
                            toggleCatalogFilterValue(filters, 'variantAttributes', attribute.slug, value.slug),
                          )
                        }
                      />
                      <Label htmlFor={`attr-${attribute.slug}-${value.slug}`} className="text-sm font-normal">
                        <CatalogFilterOptionLabel
                          label={value.label}
                          colorHex={value.colorHex}
                          colorDisplayMode={attribute.colorDisplayMode}
                          icon={attribute.icon}
                        />
                      </Label>
                    </div>
                  )
                })}
              </div>
              )}
            </AccordionContent>
          </AccordionItem>
          )
        })}

        {visibleDefinitions.characteristics.map((characteristic) => (
          <AccordionItem key={characteristic.id} value={`char-${characteristic.slug}`}>
            <AccordionTrigger className="text-sm font-semibold">
              <CatalogFilterSectionTitle name={characteristic.name} icon={characteristic.icon} />
            </AccordionTrigger>
            <AccordionContent>
              <div
                className={cn(
                  'space-y-3 pt-2',
                  !fitContent && 'max-h-52 overflow-y-auto overscroll-contain pr-0.5',
                  !fitContent && catalogSidebarScrollClassName,
                )}
              >
                {characteristic.options.map((option) => {
                  const checked = filters.characteristics[characteristic.slug]?.includes(option.slug) ?? false
                  return (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`char-${characteristic.slug}-${option.slug}`}
                        checked={checked}
                        onCheckedChange={() =>
                          onFilterChange(
                            toggleCatalogFilterValue(filters, 'characteristics', characteristic.slug, option.slug),
                          )
                        }
                      />
                      <Label
                        htmlFor={`char-${characteristic.slug}-${option.slug}`}
                        className="text-sm font-normal"
                      >
                        <CatalogFilterOptionLabel
                          label={option.label}
                          colorHex={option.colorHex}
                          colorDisplayMode={characteristic.colorDisplayMode}
                          icon={characteristic.icon}
                        />
                      </Label>
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </div>
  )
}

export { CatalogActiveFilters }

function catalogFilterPanelClassName(maxHeightPx?: number | null) {
  return cn(
    catalogSidebarPanelClassName,
    'flex flex-col overflow-hidden p-3 pl-3.5 pr-0',
    maxHeightPx == null && catalogFilterPanelDefaultMaxHeightClassName,
  )
}

function catalogFilterPanelStyle(maxHeightPx?: number | null): CSSProperties | undefined {
  return maxHeightPx != null ? { maxHeight: maxHeightPx } : undefined
}

export function CatalogFilterPanel({
  maxHeightPx,
  filterScope,
  ...props
}: FilterSidebarProps & { maxHeightPx?: number | null }) {
  const t = useTranslations('filter')
  return (
    <div
      className={catalogFilterPanelClassName(maxHeightPx)}
      style={catalogFilterPanelStyle(maxHeightPx)}
    >
      <h2 className="mb-4 shrink-0 text-lg font-semibold">{t('title')}</h2>
      <div className={catalogSidebarScrollBodyClassName}>
        <FilterSidebarContent {...props} filterScope={filterScope} />
      </div>
    </div>
  )
}

export const CATALOG_FILTER_PANEL_ID = 'filter'

export const CatalogFilterSheet = FilterSidebarMobile

export function FilterSidebar({
  maxHeightPx,
  filterScope,
  sticky = false,
  fitContent = false,
  expandContainerByDefault = false,
  collapseContainerGroupsByDefault = false,
  ...props
}: FilterSidebarProps & { maxHeightPx?: number | null }) {
  const t = useTranslations('filter')
  return (
    <aside
      className={cn(
        catalogSidebarPanelClassName,
        'hidden flex-col overflow-hidden p-3 pl-3.5 pr-0 lg:flex',
        sticky && catalogSidebarWidthClassName,
        !fitContent && maxHeightPx == null && catalogFilterPanelDefaultMaxHeightClassName,
        sticky && 'sticky z-10 self-start',
        sticky && plantsSidebarStickyTopClassName,
        sticky && fitContent && plantsSidebarMaxHeightClassName,
      )}
      style={maxHeightPx != null ? { maxHeight: maxHeightPx } : undefined}
    >
      <h2 className="mb-4 shrink-0 text-lg font-semibold">{t('title')}</h2>
      <div
        className={cn(
          fitContent
            ? cn(catalogSidebarScrollClassName, 'min-h-0 overflow-y-auto overscroll-contain pr-3')
            : catalogSidebarScrollBodyClassName,
        )}
      >
        <FilterSidebarContent
          {...props}
          filterScope={filterScope}
          fitContent={fitContent}
          expandContainerByDefault={expandContainerByDefault}
          collapseContainerGroupsByDefault={collapseContainerGroupsByDefault}
        />
      </div>
    </aside>
  )
}

/** Mobile filter trigger for StickyToolbarShell — expands inline, not a Sheet. */
export function FilterSidebarMobile({
  filterScope,
  filters,
  filterVisibility,
  filterDefinitionsOptions,
  onFilterChange,
  fitContent,
  expandContainerByDefault,
  collapseContainerGroupsByDefault,
  triggerClassName,
  compact,
  iconOnly = false,
  panelId = CATALOG_FILTER_PANEL_ID,
}: FilterSidebarProps & {
  triggerClassName?: string
  compact?: boolean
  iconOnly?: boolean
  panelId?: string
}) {
  const t = useTranslations('filter')
  const tc = useTranslations('common')
  const toolbar = useStickyToolbarOptional()
  const { priceBounds } = useCatalogFilterDefinitions(filterScope, filters, filterDefinitionsOptions)
  const activeCount = countActiveCatalogFilters(filters, priceBounds)
  const open = toolbar?.isOpen(panelId) ?? false

  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? 'icon-sm' : 'sm'}
      className={cn(
        'relative lg:hidden',
        iconOnly
          ? 'size-8 shrink-0 shadow-xs'
          : compact
            ? 'h-7 gap-1 px-2 text-xs'
            : undefined,
        open && 'border-primary/40 bg-primary/10 text-primary',
        triggerClassName,
      )}
      aria-label={t('title')}
      aria-expanded={open}
      onClick={() => toolbar?.togglePanel(panelId)}
    >
      {open ? (
        <X className={cn(iconOnly ? 'h-4 w-4' : compact ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4')} />
      ) : (
        <Filter
          className={cn(
            iconOnly ? 'h-4 w-4' : compact ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4',
          )}
        />
      )}
      {iconOnly ? (
        <span className="sr-only">{open ? tc('close') : t('title')}</span>
      ) : (
        t('title')
      )}
      {!open && activeCount > 0 ? (
        <span
          className={cn(
            'rounded-full bg-primary-gradient text-primary-foreground',
            iconOnly
              ? 'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] leading-none'
              : compact
                ? 'ml-1 min-w-[1.125rem] px-1 py-0 text-[10px] leading-none'
                : 'ml-2 px-2 py-0.5 text-xs',
          )}
        >
          {activeCount}
        </span>
      ) : null}
    </Button>
  )
}

export function CatalogFilterToolbarPanel({
  filters,
  onFilterChange,
  filterScope,
  filterVisibility,
  filterDefinitionsOptions,
  fitContent,
  expandContainerByDefault,
  collapseContainerGroupsByDefault,
}: FilterSidebarProps) {
  const t = useTranslations('filter')

  return (
    <div>
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground">{t('title')}</p>
      <FilterSidebarContent
        filters={filters}
        onFilterChange={onFilterChange}
        filterScope={filterScope}
        filterVisibility={filterVisibility}
        filterDefinitionsOptions={filterDefinitionsOptions}
        fitContent={fitContent}
        expandContainerByDefault={expandContainerByDefault}
        collapseContainerGroupsByDefault={collapseContainerGroupsByDefault}
      />
    </div>
  )
}
