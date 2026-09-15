import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatFreshPhotoDate,
  formatFreshPhotoDateCompact,
  isFreshPhotoQuantityPriceActive,
} from './fresh-photo-card'

/** Instant that is calendar 24 Aug UTC but already 25 Aug in Europe/Kyiv. */
const PHOTO_TAKEN_AT = '2026-08-24T21:33:28.028Z'

const EXPECTED_FULL: Record<string, string> = {
  sk: '24. 8. 2026',
  cs: '24. 8. 2026',
  hu: '2026. aug. 24.',
  de: '24. Aug. 2026',
  en: '24 Aug 2026',
  uk: '24 серп. 2026 р.',
}

const EXPECTED_COMPACT: Record<string, string> = {
  sk: '24. 8.',
  cs: '24. 8.',
  hu: 'aug. 24.',
  de: '24. Aug.',
  en: '24 Aug',
  uk: '24 серп.',
}

describe('formatFreshPhotoDate — UTC calendar day (hydration-safe)', () => {
  it('formats the regression timestamp identically for sk/cs/hu/de/en/uk', () => {
    for (const locale of Object.keys(EXPECTED_FULL)) {
      assert.equal(
        formatFreshPhotoDate(PHOTO_TAKEN_AT, locale),
        EXPECTED_FULL[locale],
        `full date for locale=${locale}`,
      )
      assert.equal(
        formatFreshPhotoDateCompact(PHOTO_TAKEN_AT, locale),
        EXPECTED_COMPACT[locale],
        `compact date for locale=${locale}`,
      )
    }
  })

  it('stays on UTC calendar day even when process TZ would roll the local day', () => {
    const previousTz = process.env.TZ
    try {
      for (const tz of ['UTC', 'Europe/Kyiv', 'America/Los_Angeles', 'Asia/Tokyo']) {
        process.env.TZ = tz
        assert.equal(
          formatFreshPhotoDateCompact(PHOTO_TAKEN_AT, 'sk'),
          '24. 8.',
          `compact sk under TZ=${tz}`,
        )
        assert.equal(
          formatFreshPhotoDate(PHOTO_TAKEN_AT, 'uk'),
          '24 серп. 2026 р.',
          `full uk under TZ=${tz}`,
        )
      }
    } finally {
      if (previousTz === undefined) delete process.env.TZ
      else process.env.TZ = previousTz
    }
  })

  it('does not use Europe/Kyiv (would show 25. 8. for this timestamp)', () => {
    const kyiv = new Intl.DateTimeFormat('sk-SK', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Kyiv',
    }).format(new Date(PHOTO_TAKEN_AT))
    assert.equal(kyiv, '25. 8.')
    assert.notEqual(formatFreshPhotoDateCompact(PHOTO_TAKEN_AT, 'sk'), kyiv)
  })
})

describe('isFreshPhotoQuantityPriceActive — UTC validTo day boundary', () => {
  it('treats validTo as inclusive through end of UTC calendar day', () => {
    const row = {
      minQuantity: 3,
      discountType: 'PERCENT' as const,
      value: 10,
      validFrom: null,
      validTo: '2026-08-24T00:00:00.000Z',
    }
    assert.equal(
      isFreshPhotoQuantityPriceActive(row, new Date('2026-08-24T21:33:28.028Z')),
      true,
    )
    assert.equal(
      isFreshPhotoQuantityPriceActive(row, new Date('2026-08-25T00:00:00.000Z')),
      false,
    )
  })
})
