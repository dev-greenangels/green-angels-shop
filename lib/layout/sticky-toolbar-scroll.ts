/** Matches `siteStickyToolbarOuterClassName` sticky top offset (−2px). */
const STICKY_TOP_ADJUST_PX = 2
const STICKY_SCROLL_TOLERANCE_PX = 4
const STICKY_TOOLBAR_PANEL_SCROLL_PADDING_PX = 8

export const STICKY_TOOLBAR_ROOT_ATTR = 'data-sticky-toolbar-root'
export const STICKY_TOOLBAR_PANEL_SCROLL_ATTR = 'data-sticky-toolbar-panel-scroll'

export function readSiteStickyToolbarTopPx(): number {
  if (typeof window === 'undefined') return 78

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--site-header-offset')
    .trim()

  let headerPx = 80
  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw)
    if (Number.isFinite(rem)) headerPx = rem * 16
  } else if (raw.endsWith('px')) {
    const px = Number.parseFloat(raw)
    if (Number.isFinite(px)) headerPx = px
  }

  return Math.max(0, headerPx - STICKY_TOP_ADJUST_PX)
}

function readElementStickyTopPx(element: HTMLElement): number {
  const top = getComputedStyle(element).top
  if (top && top !== 'auto') {
    const px = Number.parseFloat(top)
    if (Number.isFinite(px)) return px
  }
  return readSiteStickyToolbarTopPx()
}

/**
 * Scroll the page just enough to pin a sticky toolbar under the site header.
 * No-op when the toolbar is already stuck (avoids jumping the product list).
 */
export function scrollStickyToolbarIntoPlace(
  element: HTMLElement,
  options?: { behavior?: ScrollBehavior },
): void {
  const stickyTop = readElementStickyTopPx(element)
  const delta = element.getBoundingClientRect().top - stickyTop
  if (delta <= STICKY_SCROLL_TOLERANCE_PX) return

  const top = window.scrollY + delta
  window.scrollTo({ top, left: window.scrollX, behavior: options?.behavior ?? 'auto' })
}

export function findStickyToolbarPanelScrollContainer(
  from?: HTMLElement | null,
): HTMLElement | null {
  const roots: HTMLElement[] = []

  if (from instanceof HTMLElement) {
    const root = from.closest(`[${STICKY_TOOLBAR_ROOT_ATTR}]`)
    if (root instanceof HTMLElement) roots.push(root)
  }

  const docRoot = document.querySelector(`[${STICKY_TOOLBAR_ROOT_ATTR}]`)
  if (docRoot instanceof HTMLElement && !roots.includes(docRoot)) {
    roots.push(docRoot)
  }

  for (const root of roots) {
    const scrollers = root.querySelectorAll<HTMLElement>(
      `[${STICKY_TOOLBAR_PANEL_SCROLL_ATTR}]`,
    )

    for (const scroller of scrollers) {
      if (scroller.getBoundingClientRect().height > 16) return scroller
    }
  }

  const fallback = document.querySelector<HTMLElement>(`[${STICKY_TOOLBAR_PANEL_SCROLL_ATTR}]`)
  return fallback ?? null
}

export function scrollElementIntoScrollContainer(
  element: HTMLElement,
  container: HTMLElement,
  padding = STICKY_TOOLBAR_PANEL_SCROLL_PADDING_PX,
): void {
  const elRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  if (elRect.bottom > containerRect.bottom - padding) {
    container.scrollTop += elRect.bottom - containerRect.bottom + padding
  }
  if (elRect.top < containerRect.top + padding) {
    container.scrollTop -= containerRect.top + padding - elRect.top
  }
}

export function scrollAccordionItemElementIntoToolbarPanel(item: HTMLElement): void {
  const container = findStickyToolbarPanelScrollContainer(item)
  if (!container) return
  scrollElementIntoScrollContainer(item, container)
}

export function scheduleAccordionItemElementScroll(item: HTMLElement): void {
  const run = () => scrollAccordionItemElementIntoToolbarPanel(item)
  run()
  requestAnimationFrame(run)
  for (const delay of [120, 280, 420]) {
    window.setTimeout(run, delay)
  }
}

export function scrollAccordionItemIntoToolbarPanel(
  itemValue: string,
  origin?: HTMLElement | null,
): void {
  const container = findStickyToolbarPanelScrollContainer(origin)
  if (!container) return

  const item =
    container.querySelector<HTMLElement>(`[data-accordion-value="${CSS.escape(itemValue)}"]`) ??
    container.querySelector<HTMLElement>(
      `[data-slot="accordion-item"][data-state="open"][value="${CSS.escape(itemValue)}"]`,
    )

  if (!item) return
  scheduleAccordionItemElementScroll(item)
}
