import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  defaultAboutCmsByLocale,
  isBlankAboutCms,
  resolveAboutPageCopy,
} from './about'
import {
  isAboutCmsV1Shape,
  migrateAboutCmsV1ToV2,
  normalizeAboutPageSettings,
} from './about.normalize'
import { sanitizeCmsHtml } from '@/lib/about/safe-html'

describe('about v2 schema', () => {
  it('SK defaults do not include UA production stats numbers', () => {
    const sk = defaultAboutCmsByLocale('sk').sk!
    assert.equal(sk.stats.enabled, false)
    assert.equal(sk.production.enabled, false)
    assert.equal(sk.video.enabled, false)
    assert.equal(sk.markets.enabled, true)
    const blob = JSON.stringify(sk)
    assert.equal(blob.includes('90 ha'), false)
    assert.equal(blob.includes('500 000'), false)
    assert.equal(blob.includes('500+'), false)
  })

  it('SK defaults include approved pack for all six locales', () => {
    const byLocale = defaultAboutCmsByLocale('sk')
    for (const loc of ['sk', 'en', 'cs', 'hu', 'de', 'uk'] as const) {
      assert.ok(byLocale[loc], `missing ${loc}`)
      assert.ok(byLocale[loc]!.intro.body.includes('Green Angels International'))
      assert.ok(byLocale[loc]!.markets.body.includes('green-angels.sk'))
      assert.equal(byLocale[loc]!.delivery.ctaLabel.length > 0, true)
    }
  })

  it('UA defaults keep 90 ha / 500 000 / 500+ and rich sections on', () => {
    const uk = defaultAboutCmsByLocale('ua').uk!
    assert.equal(uk.stats.enabled, true)
    assert.equal(uk.production.enabled, true)
    assert.equal(uk.video.enabled, true)
    assert.equal(uk.markets.enabled, false)
    assert.ok(uk.stats.items.some((s) => s.value.includes('90')))
    assert.ok(uk.stats.items.some((s) => s.value.includes('500')))
  })

  it('same-locale resolve does not fall back hu → en', () => {
    const enOnly = defaultAboutCmsByLocale('sk').en!
    const settings = normalizeAboutPageSettings(
      {
        byLocale: {
          en: enOnly,
        },
      },
      'sk',
    )
    const hu = resolveAboutPageCopy(settings, 'hu', 'sk')
    assert.ok(hu)
    // Same-locale code default for hu — never the English stored copy
    assert.notEqual(hu!.hero.title, enOnly.hero.title)
    assert.match(hu!.intro.body, /Green Angels International/)
    assert.equal(resolveAboutPageCopy(settings, 'en', 'sk')?.hero.title, enOnly.hero.title)
  })

  it('migrates v1 flat CMS and disables SK stats/production', () => {
    const v1 = {
      seoTitle: 'O nás',
      seoDescription: 'desc',
      heroTitle: 'Hero',
      introHtml: '<p>Hello</p>',
      foundersImageUrl: '',
      foundersImageAlt: '',
      foundersImageStyle: 'rounded',
      statsTitle: 'Stats',
      statsSubtitle: '',
      stats: [
        { value: '90 ha', label: 'area', description: 'x' },
        { value: '500 000', label: 'plants', description: 'y' },
        { value: '500+', label: 'species', description: 'z' },
      ],
      theses: ['a'],
      whyUsTitle: 'Why',
      whyUsHtml: '<p>Why</p>',
      whyUsPoints: ['p1'],
      catalogCtaLabel: 'Cat',
      contactsCtaLabel: 'Con',
      productLinesTitle: 'Prod',
      productLines: [{ title: 'C2', description: 'd', imageUrl: '', imageAlt: '' }],
      videoTitle: 'V',
      videoSubtitle: '',
      videoEmbedUrl: 'https://www.youtube.com/embed/x',
      deliveryTitle: 'D',
      deliveryHtml: '<p>D</p>',
      deliveryCities: ['Bratislava'],
      deliveryImageUrl: '',
      deliveryImageAlt: '',
      deliveryCtaLabel: 'Ship',
    }
    assert.equal(isAboutCmsV1Shape(v1), true)
    const sk = migrateAboutCmsV1ToV2(v1, 'sk')
    assert.equal(sk.stats.enabled, false)
    assert.equal(sk.stats.items.length, 0)
    assert.equal(sk.production.enabled, false)
    assert.equal(sk.production.cards.length, 0)
    assert.equal(sk.video.enabled, false)
    assert.equal(sk.markets.enabled, true)
    assert.equal(sk.hero.title, 'Hero')
    assert.equal(sk.intro.body.includes('Hello'), true)

    const ua = migrateAboutCmsV1ToV2(v1, 'ua')
    assert.equal(ua.stats.enabled, true)
    assert.equal(ua.stats.items.length, 3)
    assert.equal(ua.production.enabled, true)
    assert.equal(ua.video.enabled, true)
    assert.equal(ua.markets.enabled, false)
  })

  it('normalize empty settings returns region defaults', () => {
    const sk = normalizeAboutPageSettings({}, 'sk')
    assert.ok(sk.byLocale.sk)
    assert.ok(sk.byLocale.hu)
    assert.ok(sk.byLocale.cs)
    assert.ok(sk.byLocale.de)
    assert.ok(sk.byLocale.uk)
    assert.equal(isBlankAboutCms(sk.byLocale.sk!), false)
    const ua = normalizeAboutPageSettings({}, 'ua')
    assert.ok(ua.byLocale.uk)
    assert.equal(ua.byLocale.sk, undefined)
  })
})

describe('sanitizeCmsHtml allowlist', () => {
  it('keeps safe tags and strips scripts/handlers', () => {
    const raw =
      '<p onclick="alert(1)">Hi <strong>there</strong></p><script>evil()</script><a href="https://example.com">x</a><a href="javascript:alert(1)">bad</a>'
    const out = sanitizeCmsHtml(raw)
    assert.equal(out.includes('script'), false)
    assert.equal(out.includes('onclick'), false)
    assert.equal(out.includes('javascript'), false)
    assert.equal(out.includes('<strong>there</strong>'), true)
    assert.equal(out.includes('href="https://example.com"'), true)
  })
})
