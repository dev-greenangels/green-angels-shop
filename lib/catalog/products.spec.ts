import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { RELATED_PRODUCTS_LIMIT } from './constants'
import { buildProductsQuery } from './products'

describe('buildProductsQuery — related products limit', () => {
  it('forwards limit so Nest can apply Prisma take', () => {
    const query = buildProductsQuery({
      categoryId: 'cat-1',
      excludeId: 'prod-current',
      limit: RELATED_PRODUCTS_LIMIT,
      locale: 'uk',
    })
    assert.equal(query.get('limit'), '4')
    assert.equal(query.get('excludeId'), 'prod-current')
    assert.equal(query.get('categoryId'), 'cat-1')
    assert.equal(query.get('published'), 'true')
    assert.equal(query.get('locale'), 'uk')
    assert.equal(query.get('page'), null)
    assert.equal(query.get('pageSize'), null)
  })

  it('forwards slugs + locale for one homepage pin batch', () => {
    const query = buildProductsQuery({
      slugs: ['beta', 'alpha'],
      locale: 'de',
      limit: 2,
    })
    assert.equal(query.get('slugs'), 'beta,alpha')
    assert.equal(query.get('locale'), 'de')
    assert.equal(query.get('published'), 'true')
    assert.equal(query.get('limit'), '2')
    assert.equal(query.get('page'), null)
  })
})
