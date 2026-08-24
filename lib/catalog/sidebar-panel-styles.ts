import { cn } from '@/lib/utils'

/** Sticky top для сайдбару на сторінці «Рослини А-Я» (під хедером, алфавітом і рядком обраних фільтрів). */
export const plantsSidebarStickyTopClassName =
  'top-[calc(var(--site-header-offset,2.75rem)+var(--plants-alphabet-sticky-height,0px)+var(--plants-alphabet-active-filters-height,0px)+0.5rem)]'

export const plantsSidebarMaxHeightClassName =
  'max-h-[calc(100dvh-var(--site-header-offset,2.75rem)-var(--plants-alphabet-sticky-height,0px)-var(--plants-alphabet-active-filters-height,0px)-1.5rem)]'

/** Ширина бокової панелі фільтрів (desktop). */
export const catalogSidebarWidthClassName = 'lg:w-64 lg:shrink-0'

/** Sticky алфавіт на «Рослини А-Я» — та сама ширина, що й рядок обраних фільтрів. */
export const plantsAlphabetStickyOuterClassName =
  'sticky top-[calc(var(--site-header-offset,5rem)-2px)] z-40 -mx-[var(--site-shell-padding-x)] w-[calc(100%+2*var(--site-shell-padding-x))] max-w-none min-w-0 lg:mx-0 lg:w-full'

/** Sticky-рядок обраних фільтрів під липким алфавітом. */
export const plantsActiveFiltersStickyOuterClassName =
  'sticky top-[calc(var(--site-header-offset,2.75rem)+var(--plants-alphabet-sticky-height,0px))] z-40 -mx-[var(--site-shell-padding-x)] mb-6 w-[calc(100%+2*var(--site-shell-padding-x))] max-w-none min-w-0 overflow-x-hidden overflow-y-visible border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:mx-0 lg:w-full'

/** Відступ sticky-панелей каталогу під хедером (відповідає `top-18`). */
export const catalogSidebarStickyTopClassName = 'top-18'
export const catalogSidebarStickyTopPx = 72

export const CATALOG_SIDEBAR_STICKY_GAP_PX = 12

/** Висота згорнутого сайдбару категорій (один рядок «Каталог» + padding). */
export const CATALOG_CATEGORY_COMPACT_HEIGHT_PX = 42

/** Спільний вигляд панелей категорій / фільтрів у каталозі (desktop). */
export const catalogSidebarPanelClassName = cn(
  'rounded-xl border border-border/45',
  'bg-card/70 backdrop-blur-md',
  'shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
  'supports-[backdrop-filter]:bg-card/55',
)

/** Тонкий напівпрозорий скролбар біля правого краю панелі. */
export const catalogSidebarScrollClassName = 'catalog-sidebar-scroll'

/** Внутрішня область зі скролом у панелях каталогу. */
export const catalogSidebarScrollBodyClassName = cn(
  catalogSidebarScrollClassName,
  'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-3',
)

/** Обмеження висоти sticky-стека категорій + фільтрів у split-layout. */
export const catalogSidebarStackMaxHeightClassName =
  'max-h-[calc(100dvh-var(--site-header-offset,4.5rem)-1rem)]'

/** Обмеження висоти панелі фільтрів за замовчуванням (desktop, окремо від стеку). */
export const catalogFilterPanelDefaultMaxHeightClassName = 'max-h-[calc(100dvh-7rem)]'
