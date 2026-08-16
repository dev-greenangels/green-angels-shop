import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isIndexingAllowed } from './indexing-policy'
import { buildRobotsRules, ROBOTS_DISALLOW_PATHS } from './robots-policy'

describe('isIndexingAllowed', () => {
  it('is off by default even in production', () => {
    assert.equal(
      isIndexingAllowed({
        allowIndexing: '',
        nodeEnv: 'production',
        origin: 'https://green-angels.sk',
      }),
      false,
    )
  })

  it('allows production origin only when GA_ALLOW_INDEXING=true', () => {
    assert.equal(
      isIndexingAllowed({
        allowIndexing: 'true',
        nodeEnv: 'production',
        origin: 'https://green-angels.sk',
      }),
      true,
    )
  })

  it('rejects localhost', () => {
    assert.equal(
      isIndexingAllowed({
        allowIndexing: 'true',
        nodeEnv: 'production',
        origin: 'http://localhost:3000',
      }),
      false,
    )
  })
})

describe('buildRobotsRules', () => {
  it('disallows the whole host when indexing is off', () => {
    const robots = buildRobotsRules({ origin: 'https://preview.example', indexingAllowed: false })
    assert.deepEqual(robots.rules, { userAgent: '*', disallow: '/' })
    assert.equal('sitemap' in robots, false)
  })

  it('emits sitemap on the request origin and disallows search/account', () => {
    const robots = buildRobotsRules({ origin: 'https://green-angels.at', indexingAllowed: true })
    assert.equal(robots.sitemap, 'https://green-angels.at/sitemap.xml')
    assert.ok(ROBOTS_DISALLOW_PATHS.includes('/*/search'))
    assert.ok(Array.isArray(robots.rules.disallow) && robots.rules.disallow.includes('/backstage'))
  })
})
