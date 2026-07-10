import type { CatalogGridColumns } from '@/lib/settings/types'

export const GRID_COLUMNS_MIN = 1
export const GRID_COLUMNS_MAX = 6

export const DEFAULT_PRODUCT_GRID_COLUMNS: CatalogGridColumns = {
  mobile: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 5,
  '2xl': 5,
}

export const DEFAULT_CATEGORY_GRID_COLUMNS: CatalogGridColumns = {
  mobile: 2,
  sm: 4,
  md: 4,
  lg: 4,
  xl: 4,
  '2xl': 4,
}

const BASE_GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
} as const

const SM_GRID_COLS = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
} as const

const MD_GRID_COLS = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
} as const

const LG_GRID_COLS = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
} as const

const XL_GRID_COLS = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
} as const

const XXL_GRID_COLS = {
  1: '2xl:grid-cols-1',
  2: '2xl:grid-cols-2',
  3: '2xl:grid-cols-3',
  4: '2xl:grid-cols-4',
  5: '2xl:grid-cols-5',
  6: '2xl:grid-cols-6',
} as const

type GridColCount = 1 | 2 | 3 | 4 | 5 | 6

function clampGridColumnCount(value: unknown, fallback: number): GridColCount {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  const clamped = Math.min(GRID_COLUMNS_MAX, Math.max(GRID_COLUMNS_MIN, parsed))
  return clamped as GridColCount
}

export function normalizeGridColumns(
  input: Partial<CatalogGridColumns> | undefined,
  defaults: CatalogGridColumns,
): CatalogGridColumns {
  return {
    mobile: clampGridColumnCount(input?.mobile, defaults.mobile),
    sm: clampGridColumnCount(input?.sm, defaults.sm),
    md: clampGridColumnCount(input?.md, defaults.md),
    lg: clampGridColumnCount(input?.lg, defaults.lg),
    xl: clampGridColumnCount(input?.xl, defaults.xl),
    '2xl': clampGridColumnCount(input?.['2xl'], defaults['2xl']),
  }
}

function buildResponsiveGridColsClass(columns: CatalogGridColumns): string {
  const mobile = columns.mobile as GridColCount
  const sm = columns.sm as GridColCount
  const md = columns.md as GridColCount
  const lg = columns.lg as GridColCount
  const xl = columns.xl as GridColCount
  const xxl = columns['2xl'] as GridColCount

  const parts: string[] = [BASE_GRID_COLS[mobile]]

  if (sm !== mobile) parts.push(SM_GRID_COLS[sm])
  if (md !== sm) parts.push(MD_GRID_COLS[md])
  if (lg !== md) parts.push(LG_GRID_COLS[lg])
  if (xl !== lg) parts.push(XL_GRID_COLS[xl])
  if (xxl !== xl) parts.push(XXL_GRID_COLS[xxl])

  return parts.join(' ')
}

export function getProductCardsGridClassName(columns?: Partial<CatalogGridColumns>): string {
  const normalized = normalizeGridColumns(columns, DEFAULT_PRODUCT_GRID_COLUMNS)
  return `grid ${buildResponsiveGridColsClass(normalized)} items-stretch gap-2.5 sm:gap-3`
}

/** Новинки, акції, пошук — стабільна щільна сітка на всіх екранах */
export const LISTING_PRODUCT_GRID_CLASS_NAME =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 items-stretch gap-2.5 sm:gap-3'

export function getCategoryCardsGridClassName(columns?: Partial<CatalogGridColumns>): string {
  const normalized = normalizeGridColumns(columns, DEFAULT_CATEGORY_GRID_COLUMNS)
  return `grid ${buildResponsiveGridColsClass(normalized)} gap-3.5 sm:gap-5`
}

export const CATALOG_GRID_BREAKPOINTS = [
  { key: 'mobile' as const, label: 'Мобільний', hint: '< 640px' },
  { key: 'sm' as const, label: 'sm', hint: '≥ 640px' },
  { key: 'md' as const, label: 'md', hint: '≥ 768px' },
  { key: 'lg' as const, label: 'lg', hint: '≥ 1024px' },
  { key: 'xl' as const, label: 'xl', hint: '≥ 1280px' },
  { key: '2xl' as const, label: '2xl', hint: '≥ 1536px' },
]
