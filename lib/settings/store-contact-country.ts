import type { CountrySiteCode } from '@/lib/country-sites/types'
import type { CountrySiteProfile, MarketSettings } from '@/lib/settings/market'
import { DEFAULT_COUNTRY_SITES } from '@/lib/settings/market'
import {
  deriveEmailsFromContactBlocks,
  derivePhonesFromContactBlocks,
} from '@/lib/settings/store-contact.normalize'
import type {
  StoreContactBlock,
  StoreContactLine,
  StoreContactSettings,
} from '@/lib/settings/types'

const SUPPORT_LABEL_HINTS = ['підтримка', 'support', 'kontakt', 'contact']

function lineLooksLikeSupport(blockTitle: string, line: StoreContactLine): boolean {
  const hay = `${blockTitle} ${line.label ?? ''}`.toLowerCase()
  return SUPPORT_LABEL_HINTS.some((hint) => hay.includes(hint))
}

/**
 * Replace the support-labeled line of `type`, else the first line of that type.
 * If none exist, append a new line to the first block (or create a Support block).
 */
function applyLineOverride(
  blocks: StoreContactBlock[],
  type: 'email' | 'phone',
  value: string,
): StoreContactBlock[] {
  let supportHit: { blockIdx: number; lineIdx: number } | null = null
  let firstHit: { blockIdx: number; lineIdx: number } | null = null

  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    const block = blocks[blockIdx]!
    for (let lineIdx = 0; lineIdx < block.lines.length; lineIdx++) {
      const line = block.lines[lineIdx]!
      if (line.type !== type) continue
      if (!firstHit) firstHit = { blockIdx, lineIdx }
      if (lineLooksLikeSupport(block.title, line)) {
        supportHit = { blockIdx, lineIdx }
        break
      }
    }
    if (supportHit) break
  }

  const hit = supportHit ?? firstHit
  if (!hit) {
    if (blocks.length === 0) {
      return [{ title: 'Support', lines: [{ type, value }] }]
    }
    return blocks.map((block, index) =>
      index === 0 ? { ...block, lines: [...block.lines, { type, value }] } : block,
    )
  }

  return blocks.map((block, blockIdx) => {
    if (blockIdx !== hit.blockIdx) return block
    return {
      ...block,
      lines: block.lines.map((line, lineIdx) =>
        lineIdx === hit.lineIdx ? { ...line, value } : line,
      ),
    }
  })
}

export type CountrySiteContactOverrides = {
  supportEmail?: string | null
  supportPhone?: string | null
}

/** Apply optional country-site email/phone overrides onto store.contact. */
export function applyCountrySiteContactOverrides(
  store: StoreContactSettings,
  overrides: CountrySiteContactOverrides | null | undefined,
): StoreContactSettings {
  const email = overrides?.supportEmail?.trim() || null
  const phone = overrides?.supportPhone?.trim() || null
  if (!email && !phone) return store

  let contactBlocks = store.contactBlocks.map((block) => ({
    ...block,
    lines: block.lines.map((line) => ({ ...line })),
  }))

  if (email) contactBlocks = applyLineOverride(contactBlocks, 'email', email)
  if (phone) contactBlocks = applyLineOverride(contactBlocks, 'phone', phone)

  return {
    ...store,
    contactBlocks,
    phones: derivePhonesFromContactBlocks(contactBlocks),
    emails: deriveEmailsFromContactBlocks(contactBlocks),
  }
}

export function resolveCountrySiteProfile(
  market: MarketSettings,
  countryCode: CountrySiteCode | null | undefined,
): CountrySiteProfile | null {
  if (market.region !== 'sk' || !countryCode) return null
  return (
    market.countrySites.find((site) => site.code === countryCode && site.enabled) ??
    DEFAULT_COUNTRY_SITES.find((site) => site.code === countryCode) ??
    null
  )
}

/** Store contacts with SK country-host email/phone overlays applied. */
export function resolveStoreForCountrySite(
  store: StoreContactSettings,
  market: MarketSettings,
  countryCode: CountrySiteCode | null | undefined,
): StoreContactSettings {
  const profile = resolveCountrySiteProfile(market, countryCode)
  if (!profile) return store
  return applyCountrySiteContactOverrides(store, {
    supportEmail: profile.supportEmail,
    supportPhone: profile.supportPhone,
  })
}
