'use client'

import { type PointerEvent } from 'react'
import { useTranslations } from 'next-intl'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { VariantAttributeFilterDefinition } from '@/lib/backstage/characteristics'
import {
  getVariantAttributeGroupCheckState,
  toggleCatalogFilterValue,
  toggleVariantAttributeGroup,
  type CatalogFilters,
} from '@/lib/catalog/filter-plants'
import {
  groupContainerFilterValues,
  type PackagingKind,
} from '@/lib/catalog/packaging-kind'
import { catalogSidebarScrollClassName } from '@/lib/catalog/sidebar-panel-styles'
import { useStickyToolbarAccordionScroll } from '@/lib/layout/use-sticky-toolbar-accordion-scroll'
import { cn } from '@/lib/utils'

type CatalogContainerFilterValuesProps = {
  attribute: VariantAttributeFilterDefinition
  filters: CatalogFilters
  onFilterChange: (filters: CatalogFilters) => void
  /** Групи типів упаковки згорнуті в акордеоні (за замовчуванням розгорнуті) */
  collapseGroups?: boolean
  /** Не обмежувати висоту списків значень — панель підлаштовується під вміст */
  fitContent?: boolean
  /** Прокрутити розгорнуту групу у видиму зону мобільної sticky-панелі */
  scrollExpandedIntoToolbarPanel?: boolean
}

function packagingGroupLabel(
  t: ReturnType<typeof useTranslations<'filter'>>,
  kind: PackagingKind | 'OTHER',
) {
  if (kind === 'OTHER') return t('packaging.other')
  return t(`packaging.${kind}` as 'packaging.POT')
}

function ContainerFilterValueList({
  attribute,
  group,
  filters,
  selected,
  onFilterChange,
  fitContent,
}: {
  attribute: VariantAttributeFilterDefinition
  group: ReturnType<typeof groupContainerFilterValues>[number]
  filters: CatalogFilters
  selected: string[]
  onFilterChange: (filters: CatalogFilters) => void
  fitContent?: boolean
}) {
  return (
    <div
      className={cn(
        'space-y-2.5',
        !fitContent && 'max-h-52 overflow-y-auto overscroll-contain pr-0.5',
        !fitContent && catalogSidebarScrollClassName,
        fitContent && 'pl-6',
      )}
    >
      {group.values.map((value) => {
        const checked = selected.includes(value.slug)
        return (
          <div key={value.slug} className="flex items-center space-x-2">
            <Checkbox
              id={`attr-${attribute.slug}-${value.slug}`}
              checked={checked}
              onCheckedChange={() =>
                onFilterChange(
                  toggleCatalogFilterValue(filters, 'variantAttributes', attribute.slug, value.slug),
                )
              }
            />
            <Label
              htmlFor={`attr-${attribute.slug}-${value.slug}`}
              className="text-sm font-normal leading-snug"
            >
              {value.label}
            </Label>
          </div>
        )
      })}
    </div>
  )
}

function ContainerFilterGroup({
  attribute,
  group,
  filters,
  selected,
  onFilterChange,
  fitContent,
  collapseGroups,
  accordionValue,
  onTriggerPointerDown,
}: {
  attribute: VariantAttributeFilterDefinition
  group: ReturnType<typeof groupContainerFilterValues>[number]
  filters: CatalogFilters
  selected: string[]
  onFilterChange: (filters: CatalogFilters) => void
  fitContent?: boolean
  collapseGroups?: boolean
  accordionValue?: string
  onTriggerPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  const t = useTranslations('filter')
  const groupSlugs = group.values.map((value) => value.slug)
  const groupId = `attr-${attribute.slug}-group-${group.kind}`
  const groupLabel = packagingGroupLabel(t, group.kind)
  const groupChecked = getVariantAttributeGroupCheckState(selected, groupSlugs)

  const groupCheckbox = (
    <Checkbox
      id={groupId}
      checked={groupChecked}
      onCheckedChange={() =>
        onFilterChange(toggleVariantAttributeGroup(filters, attribute.slug, groupSlugs))
      }
    />
  )

  if (!collapseGroups) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2">
          {groupCheckbox}
          <Label htmlFor={groupId} className="text-sm font-semibold leading-snug">
            {groupLabel}
          </Label>
        </div>
        <div
          className={cn(
            'space-y-2.5 pl-6',
            !fitContent && 'max-h-52 overflow-y-auto overscroll-contain pr-0.5',
            !fitContent && catalogSidebarScrollClassName,
          )}
        >
          {group.values.map((value) => {
            const checked = selected.includes(value.slug)
            return (
              <div key={value.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`attr-${attribute.slug}-${value.slug}`}
                  checked={checked}
                  onCheckedChange={() =>
                    onFilterChange(
                      toggleCatalogFilterValue(
                        filters,
                        'variantAttributes',
                        attribute.slug,
                        value.slug,
                      ),
                    )
                  }
                />
                <Label
                  htmlFor={`attr-${attribute.slug}-${value.slug}`}
                  className="text-sm font-normal leading-snug"
                >
                  {value.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <AccordionItem
      value={accordionValue ?? group.kind}
      data-accordion-value={accordionValue ?? group.kind}
      className="border-0"
    >
      <div className="flex items-center gap-2">
        {groupCheckbox}
        <AccordionTrigger
          className="flex-1 py-2 text-sm font-semibold hover:no-underline [&>svg]:ml-auto"
          onPointerDown={onTriggerPointerDown}
        >
          <Label htmlFor={groupId} className="pointer-events-none text-sm font-semibold leading-snug">
            {groupLabel}
          </Label>
        </AccordionTrigger>
      </div>
      <AccordionContent className="pb-1 pt-0">
        <ContainerFilterValueList
          attribute={attribute}
          group={group}
          filters={filters}
          selected={selected}
          onFilterChange={onFilterChange}
          fitContent={fitContent}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

export function CatalogContainerFilterValues({
  attribute,
  filters,
  onFilterChange,
  collapseGroups = false,
  fitContent = false,
  scrollExpandedIntoToolbarPanel = false,
}: CatalogContainerFilterValuesProps) {
  const groups = groupContainerFilterValues(attribute.values)
  const selected = filters.variantAttributes[attribute.slug] ?? []
  const { onAccordionValueChange, onTriggerPointerDown } = useStickyToolbarAccordionScroll()

  if (collapseGroups) {
    return (
      <Accordion
        type="multiple"
        defaultValue={[]}
        onValueChange={scrollExpandedIntoToolbarPanel ? onAccordionValueChange : undefined}
        className="w-full pt-2"
      >
        {groups.map((group) => (
          <ContainerFilterGroup
            key={group.kind}
            attribute={attribute}
            group={group}
            filters={filters}
            selected={selected}
            onFilterChange={onFilterChange}
            fitContent={fitContent}
            collapseGroups
            accordionValue={`container-${attribute.slug}-${group.kind}`}
            onTriggerPointerDown={scrollExpandedIntoToolbarPanel ? onTriggerPointerDown : undefined}
          />
        ))}
      </Accordion>
    )
  }

  return (
    <div className="space-y-4 pt-2">
      {groups.map((group) => (
        <ContainerFilterGroup
          key={group.kind}
          attribute={attribute}
          group={group}
          filters={filters}
          selected={selected}
          onFilterChange={onFilterChange}
          fitContent={fitContent}
        />
      ))}
    </div>
  )
}
