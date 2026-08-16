/**
 * Parse numeric min/max hints from variant attribute value labels.
 * Examples: H80-100, 80–100, H80+, C5, Ø17
 */
export type ParsedLabelNumbers = {
  numericMin: number | null
  numericMax: number | null
}

function toNumber(raw: string): number | null {
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function parseNumbersFromLabel(label: string): ParsedLabelNumbers {
  const text = label.trim()
  if (!text) return { numericMin: null, numericMax: null }

  const rangeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/)
  if (rangeMatch) {
    return {
      numericMin: toNumber(rangeMatch[1]),
      numericMax: toNumber(rangeMatch[2]),
    }
  }

  const plusMatch = text.match(/(\d+(?:[.,]\d+)?)\s*\+/)
  if (plusMatch) {
    return { numericMin: toNumber(plusMatch[1]), numericMax: null }
  }

  const singleMatch = text.match(/(\d+(?:[.,]\d+)?)/)
  if (singleMatch) {
    return { numericMin: toNumber(singleMatch[1]), numericMax: null }
  }

  return { numericMin: null, numericMax: null }
}

/** Fill empty numericMin/Max from label; never overwrite non-empty values. */
export function fillEmptyNumbersFromLabel(
  row: { label: string; numericMin: string; numericMax: string },
  valueType: 'RANGE' | 'NUMBER',
): { numericMin?: string; numericMax?: string } {
  const parsed = parseNumbersFromLabel(row.label)
  const patch: { numericMin?: string; numericMax?: string } = {}

  if (!row.numericMin.trim() && parsed.numericMin != null) {
    patch.numericMin = String(parsed.numericMin)
  }
  if (valueType === 'RANGE' && !row.numericMax.trim() && parsed.numericMax != null) {
    patch.numericMax = String(parsed.numericMax)
  }

  return patch
}

/**
 * Sync numbers from label while typing.
 * Skips fields the user has edited manually (`lockMin` / `lockMax`).
 */
export function syncNumbersFromLabel(
  row: { label: string; numericMin: string; numericMax: string },
  valueType: 'RANGE' | 'NUMBER',
  locks?: { min?: boolean; max?: boolean },
): { numericMin?: string; numericMax?: string } {
  const parsed = parseNumbersFromLabel(row.label)
  const patch: { numericMin?: string; numericMax?: string } = {}

  if (!locks?.min && parsed.numericMin != null) {
    patch.numericMin = String(parsed.numericMin)
  }

  if (valueType === 'RANGE' && !locks?.max) {
    if (parsed.numericMax != null) {
      patch.numericMax = String(parsed.numericMax)
    } else if (parsed.numericMin != null && row.numericMax.trim()) {
      // e.g. H80-100 → H80+: drop auto max when label no longer has a range
      patch.numericMax = ''
    }
  }

  return patch
}
