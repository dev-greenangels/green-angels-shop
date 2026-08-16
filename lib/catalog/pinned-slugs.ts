import { HOME_PINNED_SLUGS_MAX } from './constants'
import type { Plant } from '@/lib/types'

/** CMS pin list → unique slugs in UI order, hard-capped (textarea has no max). */
export function pinnedSlugsForQuery(
  slugs: string[],
  max = HOME_PINNED_SLUGS_MAX,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of slugs) {
    const slug = raw.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (out.length >= max) break
  }
  return out
}

export function orderPlantsByPinnedSlugs(plants: Plant[], slugs: string[]): Plant[] {
  const bySlug = new Map<string, Plant>()
  for (const plant of plants) {
    if (!bySlug.has(plant.slug)) bySlug.set(plant.slug, plant)
  }
  const seen = new Set<string>()
  const ordered: Plant[] = []
  for (const slug of slugs) {
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    const plant = bySlug.get(slug)
    if (plant) ordered.push(plant)
  }
  return ordered
}
