'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

import {
  CATALOG_CATEGORY_COMPACT_HEIGHT_PX,
  CATALOG_SIDEBAR_STICKY_GAP_PX,
  catalogSidebarStickyTopPx,
} from '@/lib/catalog/sidebar-panel-styles'

const FILTER_STICKY_SENTINEL = '[data-catalog-filter-sticky-sentinel]'

/** Крок квантування висоти — менше мікрострибків при скролі. */
const HEIGHT_SNAP_PX = 16

/** Гістерезис для compact-режиму. */
const COMPACT_ENTER_BELOW_PX = 46
const COMPACT_EXIT_ABOVE_PX = 58

function readCatalogSidebarStickyTopPx(): number {
  if (typeof window === 'undefined') return catalogSidebarStickyTopPx
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--site-header-offset')
    .trim()
  if (!raw) return catalogSidebarStickyTopPx
  const gapPx = 8
  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw)
    if (Number.isFinite(rem)) return Math.round(rem * 16) + gapPx
  }
  if (raw.endsWith('px')) {
    const px = Number.parseFloat(raw)
    if (Number.isFinite(px)) return Math.round(px) + gapPx
  }
  return catalogSidebarStickyTopPx
}

export type CatalogSidebarCollapseState = {
  maxHeightPx: number | null
  compact: boolean
  filterStickyTopPx: number
  filterStuck: boolean
}

function getCategoryFullMaxHeight(stickyTop: number): number {
  return Math.max(
    CATALOG_CATEGORY_COMPACT_HEIGHT_PX,
    window.innerHeight - stickyTop - 28,
  )
}

function snapHeight(px: number): number {
  return Math.round(px / HEIGHT_SNAP_PX) * HEIGHT_SNAP_PX
}

function readCollapseState(
  filterStickyRoot: HTMLElement,
  wasCompact: boolean,
): CatalogSidebarCollapseState {
  const sentinel = filterStickyRoot.querySelector<HTMLElement>(FILTER_STICKY_SENTINEL)
  const filterTop = filterStickyRoot.getBoundingClientRect().top
  const stickyTop = readCatalogSidebarStickyTopPx()
  const gap = CATALOG_SIDEBAR_STICKY_GAP_PX
  const fullMax = getCategoryFullMaxHeight(stickyTop)
  const filterStuck = sentinel
    ? sentinel.getBoundingClientRect().top < stickyTop
    : filterTop < stickyTop

  if (filterTop >= stickyTop + fullMax + gap) {
    return {
      maxHeightPx: null,
      compact: false,
      filterStickyTopPx: stickyTop,
      filterStuck,
    }
  }

  const availableCategoryHeight = filterTop - stickyTop - gap

  if (
    wasCompact
      ? availableCategoryHeight < COMPACT_EXIT_ABOVE_PX
      : availableCategoryHeight <= COMPACT_ENTER_BELOW_PX
  ) {
    const compactHeight = CATALOG_CATEGORY_COMPACT_HEIGHT_PX
    return {
      maxHeightPx: compactHeight,
      compact: true,
      filterStickyTopPx: stickyTop + compactHeight + gap,
      filterStuck,
    }
  }

  const maxHeightPx = snapHeight(Math.min(fullMax, Math.max(CATALOG_CATEGORY_COMPACT_HEIGHT_PX, availableCategoryHeight)))

  return {
    maxHeightPx,
    compact: false,
    filterStickyTopPx: stickyTop + maxHeightPx + gap,
    filterStuck,
  }
}

const DEFAULT_STATE: CatalogSidebarCollapseState = {
  maxHeightPx: null,
  compact: false,
  filterStickyTopPx: catalogSidebarStickyTopPx,
  filterStuck: false,
}

export function useCatalogSidebarCollapse(
  filterStickyRef: RefObject<HTMLElement | null>,
): CatalogSidebarCollapseState {
  const [state, setState] = useState<CatalogSidebarCollapseState>(DEFAULT_STATE)
  const compactRef = useRef(false)

  useEffect(() => {
    const root = filterStickyRef.current
    if (!root) return

    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readCollapseState(root, compactRef.current)
        compactRef.current = next.compact
        setState((prev) => {
          if (
            prev.maxHeightPx === next.maxHeightPx &&
            prev.compact === next.compact &&
            prev.filterStickyTopPx === next.filterStickyTopPx &&
            prev.filterStuck === next.filterStuck
          ) {
            return prev
          }
          return next
        })
      })
    }

    update()

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [filterStickyRef])

  return state
}
