import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import type { MarketRegion } from '@/lib/settings/market'
import type {
  StoreContactBlock,
  StoreContactCmsCopy,
  StoreContactSettings,
  StoreHoursSchedule,
} from '@/lib/settings/types'

export const EMPTY_STORE_CONTACT_CMS: StoreContactCmsCopy = {
  addressLine1: '',
  addressLine2: '',
  contactBlocks: [],
  schedules: [],
}

export function primaryStoreCmsLocale(region: MarketRegion): AppLocale {
  return region === 'sk' ? 'sk' : 'uk'
}

export function extractStoreContactCmsCopy(
  store: Pick<
    StoreContactSettings,
    'addressLine1' | 'addressLine2' | 'contactBlocks' | 'schedules'
  >,
): StoreContactCmsCopy {
  return {
    addressLine1: store.addressLine1 ?? '',
    addressLine2: store.addressLine2 ?? '',
    contactBlocks: structuredClone(store.contactBlocks ?? []),
    schedules: structuredClone(store.schedules ?? []),
  }
}

export function cloneStoreContactCms(copy: StoreContactCmsCopy): StoreContactCmsCopy {
  return structuredClone(copy)
}

export function isBlankStoreContactCms(copy: StoreContactCmsCopy): boolean {
  return (
    !copy.addressLine1.trim() &&
    !copy.addressLine2.trim() &&
    copy.contactBlocks.length === 0 &&
    copy.schedules.length === 0
  )
}

function normalizeBlock(raw: unknown): StoreContactBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const block = raw as StoreContactBlock
  const lines = Array.isArray(block.lines)
    ? block.lines
        .map((line) => ({
          type: line.type,
          label: line.label,
          value: String(line.value ?? ''),
        }))
        .filter((line) => line.value.trim())
    : []
  if (!lines.length) return null
  return { title: String(block.title ?? '').trim(), lines }
}

function normalizeSchedule(raw: unknown): StoreHoursSchedule | null {
  if (!raw || typeof raw !== 'object') return null
  const schedule = raw as StoreHoursSchedule
  const entries = Array.isArray(schedule.entries)
    ? schedule.entries.map((e) => ({
        label: String(e?.label ?? ''),
        value: String(e?.value ?? ''),
      }))
    : []
  return {
    title: String(schedule.title ?? ''),
    entries,
    note: schedule.note ? String(schedule.note) : '',
  }
}

function normalizeCmsCopy(raw: unknown): StoreContactCmsCopy | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Partial<StoreContactCmsCopy>
  return {
    addressLine1: String(source.addressLine1 ?? ''),
    addressLine2: String(source.addressLine2 ?? ''),
    contactBlocks: Array.isArray(source.contactBlocks)
      ? source.contactBlocks
          .map(normalizeBlock)
          .filter((b): b is StoreContactBlock => b != null)
      : [],
    schedules: Array.isArray(source.schedules)
      ? source.schedules
          .map(normalizeSchedule)
          .filter((s): s is StoreHoursSchedule => s != null)
      : [],
  }
}

export function normalizeStoreContactByLocale(
  raw: unknown,
  legacyFlat: Pick<
    StoreContactSettings,
    'addressLine1' | 'addressLine2' | 'contactBlocks' | 'schedules'
  >,
  region: MarketRegion,
): Partial<Record<AppLocale, StoreContactCmsCopy>> {
  const byLocale: Partial<Record<AppLocale, StoreContactCmsCopy>> = {}
  if (raw && typeof raw === 'object') {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = normalizeCmsCopy((raw as Record<string, unknown>)[locale])
      if (copy) byLocale[locale] = copy
    }
  }
  if (Object.keys(byLocale).length === 0) {
    const extracted = extractStoreContactCmsCopy(legacyFlat)
    if (!isBlankStoreContactCms(extracted)) {
      byLocale[primaryStoreCmsLocale(region)] = extracted
    }
  }
  return byLocale
}

export function applyStoreContactCmsCopy(
  store: StoreContactSettings,
  copy: StoreContactCmsCopy,
): StoreContactSettings {
  const contactBlocks = structuredClone(copy.contactBlocks)
  return {
    ...store,
    addressLine1: copy.addressLine1,
    addressLine2: copy.addressLine2,
    contactBlocks,
    schedules: structuredClone(copy.schedules),
    phones: contactBlocks.flatMap((block) =>
      block.lines
        .filter((line) => line.type === 'phone' && line.value.trim())
        .map((line) => ({ label: block.title, phone: line.value.trim() })),
    ),
    emails: contactBlocks.flatMap((block) =>
      block.lines
        .filter((line) => line.type === 'email' && line.value.trim())
        .map((line) => ({ label: block.title, email: line.value.trim() })),
    ),
  }
}

export function resolveStoreContactForLocale(
  store: StoreContactSettings,
  locale: AppLocale,
): StoreContactSettings {
  const copy = store.byLocale?.[locale]
  if (copy && !isBlankStoreContactCms(copy)) {
    return applyStoreContactCmsCopy(store, copy)
  }
  // Fallback: keep flat shared/legacy texts (phones/emails derived later by normalize)
  return store
}

export function getStoreContactCmsForEdit(
  store: StoreContactSettings,
  locale: AppLocale,
  region: MarketRegion = 'ua',
): StoreContactCmsCopy {
  const stored = store.byLocale?.[locale]
  if (stored && !isBlankStoreContactCms(stored)) return cloneStoreContactCms(stored)

  const primary = primaryStoreCmsLocale(region)
  const primaryCopy = store.byLocale?.[primary]
  if (primaryCopy && !isBlankStoreContactCms(primaryCopy)) {
    return cloneStoreContactCms(primaryCopy)
  }

  for (const loc of SUPPORTED_LOCALES) {
    const copy = store.byLocale?.[loc]
    if (copy && !isBlankStoreContactCms(copy)) return cloneStoreContactCms(copy)
  }

  const fromFlat = extractStoreContactCmsCopy(store)
  if (!isBlankStoreContactCms(fromFlat)) return fromFlat
  return cloneStoreContactCms(EMPTY_STORE_CONTACT_CMS)
}

/**
 * Keep contact block / schedule structure aligned across locales.
 * Values (phones, times) follow the source locale; titles/labels keep per-locale text when present.
 */
export function syncStoreCmsStructureAcrossLocales(
  byLocale: Partial<Record<AppLocale, StoreContactCmsCopy>>,
  sourceLocale: AppLocale,
  source: StoreContactCmsCopy,
): Partial<Record<AppLocale, StoreContactCmsCopy>> {
  const next: Partial<Record<AppLocale, StoreContactCmsCopy>> = {
    ...byLocale,
    [sourceLocale]: cloneStoreContactCms(source),
  }

  for (const loc of SUPPORTED_LOCALES) {
    if (loc === sourceLocale) continue
    const existing = next[loc]
    if (!existing || isBlankStoreContactCms(existing)) {
      next[loc] = cloneStoreContactCms(source)
      continue
    }
    next[loc] = mergeStoreCmsStructure(existing, source)
  }
  return next
}

function mergeStoreCmsStructure(
  existing: StoreContactCmsCopy,
  source: StoreContactCmsCopy,
): StoreContactCmsCopy {
  return {
    addressLine1: existing.addressLine1.trim() ? existing.addressLine1 : source.addressLine1,
    addressLine2: existing.addressLine2.trim() ? existing.addressLine2 : source.addressLine2,
    contactBlocks: source.contactBlocks.map((srcBlock, i) => {
      const prev = existing.contactBlocks[i]
      return {
        title: prev?.title?.trim() ? prev.title : srcBlock.title,
        lines: srcBlock.lines.map((srcLine, j) => {
          const prevLine = prev?.lines[j]
          return {
            type: srcLine.type,
            value: srcLine.value,
            label: prevLine?.label?.trim() ? prevLine.label : srcLine.label,
          }
        }),
      }
    }),
    schedules: source.schedules.map((srcSchedule, i) => {
      const prev = existing.schedules[i]
      return {
        title: prev?.title?.trim() ? prev.title : srcSchedule.title,
        note: prev?.note?.trim() ? prev.note : srcSchedule.note,
        entries: srcSchedule.entries.map((srcEntry, j) => {
          const prevEntry = prev?.entries[j]
          return {
            label: prevEntry?.label?.trim() ? prevEntry.label : srcEntry.label,
            value: srcEntry.value,
          }
        }),
      }
    }),
  }
}

export function commitStoreCmsForLocale(
  store: StoreContactSettings,
  contentLocale: AppLocale,
): StoreContactSettings {
  const source = extractStoreContactCmsCopy(store)
  const byLocale = syncStoreCmsStructureAcrossLocales(store.byLocale ?? {}, contentLocale, source)
  return {
    ...store,
    byLocale,
  }
}

export function collectStoreCmsFieldValues(
  store: StoreContactSettings,
  getter: (copy: StoreContactCmsCopy) => string,
  region: MarketRegion = 'ua',
): Partial<Record<AppLocale, string>> {
  const out: Partial<Record<AppLocale, string>> = {}
  for (const loc of SUPPORTED_LOCALES) {
    const copy = getStoreContactCmsForEdit(store, loc, region)
    out[loc] = getter(copy)
  }
  return out
}

export function applyStoreCmsFieldTranslations(
  store: StoreContactSettings,
  contentLocale: AppLocale,
  region: MarketRegion,
  setter: (copy: StoreContactCmsCopy, value: string) => StoreContactCmsCopy,
  translations: Partial<Record<AppLocale, string>>,
): StoreContactSettings {
  const byLocale: Partial<Record<AppLocale, StoreContactCmsCopy>> = { ...store.byLocale }
  for (const loc of SUPPORTED_LOCALES) {
    const base = getStoreContactCmsForEdit(store, loc, region)
    const value = translations[loc] ?? ''
    byLocale[loc] = setter(base, value)
  }
  const contentCopy = byLocale[contentLocale] ?? getStoreContactCmsForEdit(store, contentLocale, region)
  return applyStoreContactCmsCopy({ ...store, byLocale }, contentCopy)
}
