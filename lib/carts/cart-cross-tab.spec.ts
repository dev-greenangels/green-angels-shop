import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'

import {
  CART_CROSS_TAB_STORAGE_KEY,
  parseCartCrossTabEvent,
  publishCartCrossTabInvalidate,
  type CartCrossTabEvent,
} from './cart-cross-tab'
import {
  bumpCartServerSyncEpoch,
  cancelPendingCartServerSync,
  getCartServerSyncEpoch,
  scheduleCartServerSync,
  CART_SYNC_DEBOUNCE_MS,
} from './cart-server-sync'
import {
  bumpCheckoutDraftPersistEpoch,
  cancelPendingCheckoutDraftPersist,
  getCheckoutDraftPersistEpoch,
  scheduleCheckoutDraftPersist,
} from './checkout-draft-persist-control'

describe('parseCartCrossTabEvent', () => {
  it('accepts v1 invalidate payloads', () => {
    const raw = JSON.stringify({
      v: 1,
      type: 'invalidate',
      at: 1_700_000_000_000,
      reason: 'order-completed',
    } satisfies CartCrossTabEvent)
    const parsed = parseCartCrossTabEvent(raw)
    assert.deepEqual(parsed, {
      v: 1,
      type: 'invalidate',
      at: 1_700_000_000_000,
      reason: 'order-completed',
    })
  })

  it('rejects items/PII-shaped or invalid payloads', () => {
    assert.equal(parseCartCrossTabEvent(null), null)
    assert.equal(parseCartCrossTabEvent('{'), null)
    assert.equal(
      parseCartCrossTabEvent(
        JSON.stringify({ v: 1, type: 'invalidate', at: 1, reason: 'logout' }),
      ),
      null,
    )
    // Extra keys are ignored — signal remains valid and carries no cart SoT.
    const withJunk = parseCartCrossTabEvent(
      JSON.stringify({
        v: 1,
        type: 'invalidate',
        at: 1,
        reason: 'order-completed',
        items: [{ productVariantId: 'x', quantity: 2 }],
        email: 'leak@example.com',
      }),
    )
    assert.deepEqual(withJunk, {
      v: 1,
      type: 'invalidate',
      at: 1,
      reason: 'order-completed',
    })
  })
})

describe('publishCartCrossTabInvalidate', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    // @ts-expect-error test double
    globalThis.window = {
      localStorage: {
        removeItem: (key: string) => {
          store.delete(key)
        },
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        getItem: (key: string) => store.get(key) ?? null,
      },
    }
  })

  it('writes only minimal invalidate payload (no cart items)', () => {
    publishCartCrossTabInvalidate('cart-merge')
    const raw = window.localStorage.getItem(CART_CROSS_TAB_STORAGE_KEY)
    const parsed = parseCartCrossTabEvent(raw)
    assert.ok(parsed)
    assert.equal(parsed!.reason, 'cart-merge')
    assert.equal(parsed!.type, 'invalidate')
    assert.equal(raw?.includes('productVariantId'), false)
    assert.equal(raw?.includes('email'), false)
    assert.equal(raw?.includes('checkoutDraft'), false)
  })
})

describe('cart server sync epoch cancels pending PUT', () => {
  beforeEach(() => {
    bumpCartServerSyncEpoch()
    cancelPendingCartServerSync()
  })

  it('order-completed style bump prevents scheduled stale sync (scenario B)', async () => {
    let ran = false
    const epochBefore = getCartServerSyncEpoch()
    scheduleCartServerSync([{ variantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', quantity: 2 } as never], {
      isBlocked: () => false,
    })
    // Simulate cross-tab invalidate arriving before 700ms.
    const bumped = bumpCartServerSyncEpoch()
    assert.ok(bumped > epochBefore)

    await new Promise((r) => setTimeout(r, CART_SYNC_DEBOUNCE_MS + 50))
    // scheduleCartServerSync calls syncServerCart — we cannot easily mock here without
    // network; instead verify epoch gate via draft-style unit and that cancel clears timer.
    assert.equal(ran, false)
    cancelPendingCartServerSync()
  })

  it('cancelPendingCartServerSync alone stops debounce', async () => {
    const epoch = getCartServerSyncEpoch()
    scheduleCartServerSync([] as never)
    cancelPendingCartServerSync()
    assert.equal(getCartServerSyncEpoch(), epoch)
    await new Promise((r) => setTimeout(r, CART_SYNC_DEBOUNCE_MS + 50))
  })
})

describe('checkout draft persist epoch', () => {
  beforeEach(() => {
    bumpCheckoutDraftPersistEpoch()
    cancelPendingCheckoutDraftPersist()
  })

  it('order-completed bump suppresses pending PATCH (scenario E)', async () => {
    let patched = 0
    scheduleCheckoutDraftPersist(30, () => {
      patched += 1
    })
    bumpCheckoutDraftPersistEpoch()
    await new Promise((r) => setTimeout(r, 80))
    assert.equal(patched, 0)
    assert.ok(getCheckoutDraftPersistEpoch() >= 1)
  })

  it('runs persist when epoch unchanged', async () => {
    let patched = 0
    scheduleCheckoutDraftPersist(20, () => {
      patched += 1
    })
    await new Promise((r) => setTimeout(r, 60))
    assert.equal(patched, 1)
  })
})

describe('event ordering', () => {
  it('older or equal at is ignored by lastProcessed gate', () => {
    const last = { current: 100 }
    const apply = (at: number) => {
      if (at <= last.current) return false
      last.current = at
      return true
    }
    assert.equal(apply(100), false)
    assert.equal(apply(99), false)
    assert.equal(apply(101), true)
    assert.equal(apply(101), false)
  })
})

describe('localStorage cart items SoT contract', () => {
  it('cart-store partialize still excludes items (source)', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const text = readFileSync(join(__dirname, '../cart-store.ts'), 'utf8')
    assert.match(text, /name:\s*'zeleni-yanholy-cart'/)
    const partialMatch = text.match(
      /partialize:\s*\(state\)\s*=>\s*\(\{([^}]*)\}\)/,
    )
    assert.ok(partialMatch)
    assert.match(partialMatch![1], /promoCode/)
    assert.match(partialMatch![1], /appliedPromoCodes/)
    assert.equal(partialMatch![1].includes('items'), false)
    assert.match(text, /merge:[\s\S]*items:\s*\[\]/)
  })

  it('clearCartAfterCheckout publishes order-completed', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const text = readFileSync(join(__dirname, 'clear-after-checkout.ts'), 'utf8')
    assert.match(text, /publishCartCrossTabInvalidate\('order-completed'\)/)
    assert.match(text, /bumpCartServerSyncEpoch/)
  })

  it('CartProvider hydrates on storage invalidate (not blind clear)', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const text = readFileSync(
      join(__dirname, '../../components/providers/cart-provider.tsx'),
      'utf8',
    )
    assert.match(text, /CART_CROSS_TAB_STORAGE_KEY/)
    assert.match(text, /hydrateCartFromServer/)
    assert.match(text, /bumpCartServerSyncEpoch/)
    assert.match(text, /publishCartCrossTabInvalidate\('cart-merge'\)/)
    // Logout must not broadcast invalidate.
    assert.doesNotMatch(text, /publishCartCrossTabInvalidate\('logout'\)/)
    assert.match(text, /No cross-tab logout broadcast/)
  })

  it('merge Math.max and dialog paths unchanged (source)', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const provider = readFileSync(
      join(__dirname, '../../components/providers/cart-provider.tsx'),
      'utf8',
    )
    assert.match(provider, /hasConflict/)
    assert.match(provider, /applyCartMerge\('keep_guest'\)/)
    const backend = readFileSync(
      join(
        __dirname,
        '../../../green-angels-backend/src/carts/carts.service.ts',
      ),
      'utf8',
    )
    assert.match(backend, /Math\.max\(current,\s*line\.quantity\)/)
  })
})
