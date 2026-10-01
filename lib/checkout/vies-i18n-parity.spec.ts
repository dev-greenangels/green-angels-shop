import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SHOP_LOCALES = ['sk', 'en', 'uk', 'cs', 'hu', 'de'] as const
const BACKSTAGE_LOCALES = ['uk', 'en', 'sk', 'cs', 'de', 'hu'] as const

const SHOP_ROOT = join(process.cwd(), 'messages')
const BACKSTAGE_ROOT = join(process.cwd(), 'messages/backstage')

/** Canonical VIES/checkout keys introduced or relied on by the VIES workflow. */
const CHECKOUT_VIES_KEYS = [
  'vatIdLabel',
  'vatIdPlaceholder',
  'vatIdOptionalHint',
  'vatIdChecking',
  'vatIdVerified',
  'vatIdVerifiedVatApplies',
  'vatIdZeroEligible',
  'vatIdDeliverySkVatApplies',
  'vatIdInvalidContinue',
  'vatIdUnavailableContinue',
  'vatIdFormatError',
  'vatIdRetry',
  'vatZeroDphApplied',
  'orderVatReverseChargeNote',
  'orderVatUnavailableNote',
  'orderVatInvalidNote',
] as const

function loadJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

describe('VIES translation key parity', () => {
  it('checkout VIES keys exist in sk/en/uk/cs/hu/de', () => {
    for (const locale of SHOP_LOCALES) {
      const data = loadJson(join(SHOP_ROOT, `${locale}.json`))
      const checkout = data.checkout as Record<string, unknown>
      assert.ok(checkout, `${locale}: missing checkout`)
      for (const key of CHECKOUT_VIES_KEYS) {
        assert.equal(
          typeof checkout[key],
          'string',
          `${locale}.checkout.${key} missing or not a string`,
        )
        assert.ok(
          String(checkout[key]).trim().length > 0,
          `${locale}.checkout.${key} empty`,
        )
      }
    }
  })

  it('backstage orderVies key parity across all Backstage locales', () => {
    const canonical = loadJson(join(BACKSTAGE_ROOT, 'en.json')).orderVies as Record<
      string,
      unknown
    >
    assert.ok(canonical, 'en orderVies missing')
    const keys = Object.keys(canonical).sort()
    assert.ok(keys.includes('flexiNoteSyncFailed'))
    assert.ok(keys.includes('error'))
    assert.ok(keys.includes('retry'))

    for (const locale of BACKSTAGE_LOCALES) {
      const bundle = loadJson(join(BACKSTAGE_ROOT, `${locale}.json`)).orderVies as Record<
        string,
        unknown
      >
      assert.ok(bundle, `${locale}: missing orderVies`)
      for (const key of keys) {
        assert.equal(
          typeof bundle[key],
          'string',
          `${locale}.orderVies.${key} missing or not a string`,
        )
      }
      assert.deepEqual(Object.keys(bundle).sort(), keys, `${locale} orderVies key mismatch`)
    }
  })

  it('ERROR checkout copy must not claim invalid VAT ID', () => {
    for (const locale of SHOP_LOCALES) {
      const checkout = loadJson(join(SHOP_ROOT, `${locale}.json`)).checkout as Record<
        string,
        string
      >
      const unavailable = checkout.vatIdUnavailableContinue.toLowerCase()
      // Must not look like a confirmed invalid number message.
      assert.equal(unavailable.includes('invalid number'), false, locale)
      assert.ok(
        unavailable.length > 20,
        `${locale} unavailable message too short`,
      )
    }
  })
})
