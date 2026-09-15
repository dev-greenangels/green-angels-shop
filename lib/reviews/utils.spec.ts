import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatFreshPhotoDateCompact } from '@/lib/variant-photos/fresh-photo-card'
import { businessTimeZoneForMarket } from '@/lib/settings/market'
import { formatReviewDate } from './utils'

/** Near UTC midnight — already next calendar day in Bratislava/Kyiv (summer). */
const BOUNDARY = '2026-08-24T22:30:00.000Z'

const EXPECTED_EU: Record<string, string> = {
  sk: '25. augusta 2026',
  cs: '25. srpna 2026',
  hu: '2026. augusztus 25.',
  de: '25. August 2026',
  en: '25 August 2026',
  uk: '25 серпня 2026 р.',
}

describe('businessTimeZoneForMarket', () => {
  it('maps SK/EU → Bratislava and UA → Kyiv', () => {
    assert.equal(businessTimeZoneForMarket('sk'), 'Europe/Bratislava')
    assert.equal(businessTimeZoneForMarket('ua'), 'Europe/Kyiv')
  })
})

describe('formatReviewDate — deploy business TZ (hydration-safe)', () => {
  it('formats the boundary timestamp for EU (Bratislava) across locales', () => {
    for (const locale of Object.keys(EXPECTED_EU)) {
      assert.equal(
        formatReviewDate(BOUNDARY, locale, 'sk'),
        EXPECTED_EU[locale],
        `EU review date for locale=${locale}`,
      )
    }
  })

  it('stays on business calendar day regardless of process TZ', () => {
    const previousTz = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Europe/Kyiv']) {
        process.env.TZ = tz
        assert.equal(
          formatReviewDate(BOUNDARY, 'sk', 'sk'),
          '25. augusta 2026',
          `EU sk under process TZ=${tz}`,
        )
        assert.equal(
          formatReviewDate(BOUNDARY, 'uk', 'ua'),
          '25 серпня 2026 р.',
          `UA uk under process TZ=${tz}`,
        )
      }
    } finally {
      if (previousTz === undefined) delete process.env.TZ
      else process.env.TZ = previousTz
    }
  })

  it('does not follow browser-local semantics (LA would stay on Aug 24)', () => {
    const la = new Intl.DateTimeFormat('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Los_Angeles',
    }).format(new Date(BOUNDARY))
    assert.equal(la, '24. augusta 2026')
    assert.notEqual(formatReviewDate(BOUNDARY, 'sk', 'sk'), la)
  })

  it('uses Kyiv for UA — winter boundary differs from Bratislava', () => {
    // Winter: Bratislava CET (+1) still 15 Jan; Kyiv EET (+2) already 16 Jan.
    const winter = '2026-01-15T22:30:00.000Z'
    assert.equal(formatReviewDate(winter, 'sk', 'sk'), '15. januára 2026')
    assert.equal(formatReviewDate(winter, 'uk', 'ua'), '16 січня 2026 р.')
  })
})

describe('Fresh Photos remain UTC calendar dates (not Bratislava)', () => {
  it('keeps UTC day for the #418 regression timestamp', () => {
    const photoIso = '2026-08-24T21:33:28.028Z'
    assert.equal(formatFreshPhotoDateCompact(photoIso, 'sk'), '24. 8.')
    // Bratislava would still be 24. 8. for 21:33Z; Kyiv would roll to 25.
    const kyiv = new Intl.DateTimeFormat('sk-SK', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Kyiv',
    }).format(new Date(photoIso))
    assert.equal(kyiv, '25. 8.')
    assert.notEqual(formatFreshPhotoDateCompact(photoIso, 'sk'), kyiv)
  })

  it('does not switch Fresh Photos to Europe/Bratislava for the review boundary', () => {
    // 22:30Z is still 24 Aug UTC, but 25 Aug in Bratislava.
    assert.equal(formatFreshPhotoDateCompact(BOUNDARY, 'sk'), '24. 8.')
    assert.equal(formatReviewDate(BOUNDARY, 'sk', 'sk'), '25. augusta 2026')
  })
})
