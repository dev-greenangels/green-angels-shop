export type PackagingKind = 'POT' | 'ROOT_BALL' | 'BARE_ROOT' | 'POT_ROOT_BALL'

export const PACKAGING_KIND_ORDER: PackagingKind[] = [
  'POT',
  'ROOT_BALL',
  'BARE_ROOT',
  'POT_ROOT_BALL',
]

export function inferPackagingKind(label: string, slug: string): PackagingKind | null {
  const normalizedLabel = label.trim()
  const normalizedSlug = slug.trim().toLowerCase()
  if (!normalizedLabel && !normalizedSlug) return null

  const codeToken = (normalizedLabel.split(/\s+/)[0] ?? normalizedSlug).toUpperCase()

  if (/^CWRB/.test(codeToken) || normalizedSlug.startsWith('cwrb')) {
    return 'POT_ROOT_BALL'
  }
  if (/^WRB/.test(codeToken) || normalizedSlug.startsWith('wrb')) {
    return 'ROOT_BALL'
  }
  if (/^RB/.test(codeToken) || /^rb(-|$)/.test(normalizedSlug)) {
    return 'BARE_ROOT'
  }
  if (/^P\d/.test(codeToken) || /^p\d/.test(normalizedSlug)) {
    return 'POT'
  }
  if (/^C\d/.test(codeToken) || /^c\d/.test(normalizedSlug)) {
    return 'POT'
  }
  if (/горщик|контейнер|бокс/i.test(normalizedLabel)) {
    return 'POT'
  }
  if (/ком\/сітка\/горщ|горщ.*ком/i.test(normalizedLabel)) {
    return 'POT_ROOT_BALL'
  }
  if (/ком\/сітка/i.test(normalizedLabel)) {
    return 'ROOT_BALL'
  }
  if (/голий\s*корін/i.test(normalizedLabel)) {
    return 'BARE_ROOT'
  }
  if (/\bком\b/i.test(normalizedLabel)) {
    return 'BARE_ROOT'
  }

  return null
}

export function resolvePackagingKind(
  label: string,
  slug: string,
  explicit?: PackagingKind | null,
): PackagingKind | null {
  if (explicit) return explicit
  return inferPackagingKind(label, slug)
}

export function groupContainerFilterValues<
  T extends { slug: string; label: string; packagingKind?: PackagingKind | null },
>(values: T[]): Array<{ kind: PackagingKind | 'OTHER'; values: T[] }> {
  const buckets = new Map<PackagingKind | 'OTHER', T[]>()

  for (const value of values) {
    const kind = resolvePackagingKind(value.label, value.slug, value.packagingKind) ?? 'OTHER'
    const bucket = buckets.get(kind) ?? []
    bucket.push(value)
    buckets.set(kind, bucket)
  }

  const orderedKinds: Array<PackagingKind | 'OTHER'> = [...PACKAGING_KIND_ORDER, 'OTHER']
  return orderedKinds
    .map((kind) => ({ kind, values: buckets.get(kind) ?? [] }))
    .filter((group) => group.values.length > 0)
}
