import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ABOUT_SCHEMA_VERSION, cloneCms, emptyAboutCms } from './about'
import { buildApprovedEuAboutByLocale, EU_APPROVED_ABOUT_CONTENT_VERSION } from './about-eu-approved.v1'
import { decideEuAboutBootstrap } from './about-eu-bootstrap'

describe('EU About bootstrap', () => {
  it('skips UA region', () => {
    const result = decideEuAboutBootstrap('ua', {
      schemaVersion: ABOUT_SCHEMA_VERSION,
      byLocale: {},
    })
    assert.equal(result.action, 'skip-ua')
  })

  it('seeds full approved pack for empty SK settings', () => {
    const result = decideEuAboutBootstrap('sk', {
      schemaVersion: ABOUT_SCHEMA_VERSION,
      byLocale: {},
    })
    assert.equal(result.action, 'seed-full')
    if (result.action !== 'seed-full') return
    assert.equal(result.next.euApprovedContentVersion, EU_APPROVED_ABOUT_CONTENT_VERSION)
    for (const loc of ['sk', 'en', 'cs', 'hu', 'de', 'uk'] as const) {
      assert.ok(result.next.byLocale[loc], `missing ${loc}`)
      assert.equal(result.next.byLocale[loc]!.stats.enabled, false)
      assert.equal(result.next.byLocale[loc]!.production.enabled, false)
      assert.equal(result.next.byLocale[loc]!.video.enabled, false)
      assert.equal(result.next.byLocale[loc]!.markets.enabled, true)
      assert.equal(result.next.byLocale[loc]!.production.cards.length, 0)
      assert.equal(result.next.byLocale[loc]!.stats.items.length, 0)
    }
    const blob = JSON.stringify(result.next)
    assert.equal(blob.includes('90 ha'), false)
    assert.equal(blob.includes('500 000'), false)
    assert.equal(blob.includes('500+'), false)
  })

  it('is no-op when euApprovedContentVersion matches', () => {
    const approved = buildApprovedEuAboutByLocale()
    const custom = cloneCms(approved.sk)
    custom.intro.body = '<p>MANAGER CUSTOM SENTENCE</p>'
    const result = decideEuAboutBootstrap('sk', {
      schemaVersion: ABOUT_SCHEMA_VERSION,
      euApprovedContentVersion: EU_APPROVED_ABOUT_CONTENT_VERSION,
      byLocale: { sk: custom, ...approved },
    })
    assert.equal(result.action, 'noop')
  })

  it('fill-missing preserves manager SK copy and stamps version', () => {
    const custom = emptyAboutCms('sk')
    custom.seo.title = 'Custom'
    custom.hero.title = 'Custom hero'
    custom.intro.body =
      '<p>MANAGER EDIT — Green Angels International s.r.o. custom sentence.</p>'
    custom.markets.body = '<p>Custom markets body that is long enough to protect.</p>'
    const result = decideEuAboutBootstrap('sk', {
      schemaVersion: ABOUT_SCHEMA_VERSION,
      byLocale: { sk: custom },
    })
    assert.equal(result.action, 'fill-missing')
    if (result.action !== 'fill-missing') return
    assert.match(result.next.byLocale.sk!.intro.body, /MANAGER EDIT/)
    assert.ok(result.next.byLocale.en)
    assert.ok(result.next.byLocale.cs)
    assert.equal(result.next.euApprovedContentVersion, EU_APPROVED_ABOUT_CONTENT_VERSION)
  })

  it('second decision after seed is no-op', () => {
    const first = decideEuAboutBootstrap('sk', {
      schemaVersion: ABOUT_SCHEMA_VERSION,
      byLocale: {},
    })
    assert.equal(first.action, 'seed-full')
    if (first.action !== 'seed-full') return
    const second = decideEuAboutBootstrap('sk', first.next)
    assert.equal(second.action, 'noop')
  })
})
