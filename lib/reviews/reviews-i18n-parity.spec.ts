import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SHOP_LOCALES = ['uk', 'en', 'sk', 'cs', 'hu', 'de'] as const
const SHOP_ROOT = join(process.cwd(), 'messages')

/** Keys added / relied on by Reviews P0–P2 homepage + unified cards. */
const REVIEWS_P0_P2_KEYS = [
  'ratingOnlyLabel',
  'plantsOverflow',
  'orderSubmissionLabel',
  'storeReviewLabel',
  'productReviewsLabel',
  'productFallback',
  'verifiedPurchase',
  'verifiedCustomer',
] as const

function loadJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

describe('Reviews P0–P2 storefront i18n parity', () => {
  it('reviews.ratingOnlyLabel and plantsOverflow exist for all six locales', () => {
    for (const locale of SHOP_LOCALES) {
      const data = loadJson(join(SHOP_ROOT, `${locale}.json`))
      const reviews = data.reviews as Record<string, unknown> | undefined
      assert.ok(reviews, `${locale}: missing reviews namespace`)

      for (const key of ['ratingOnlyLabel', 'plantsOverflow'] as const) {
        assert.equal(
          typeof reviews[key],
          'string',
          `${locale}.reviews.${key} missing (getTranslations('reviews') would MISSING_MESSAGE)`,
        )
        assert.ok(String(reviews[key]).trim().length > 0, `${locale}.reviews.${key} empty`)
      }

      assert.match(
        String(reviews.plantsOverflow),
        /\{count\}/,
        `${locale}.reviews.plantsOverflow must keep {count} placeholder`,
      )
    }
  })

  it('does not leave P0–P2 review keys only under common (wrong namespace regression)', () => {
    for (const locale of SHOP_LOCALES) {
      const data = loadJson(join(SHOP_ROOT, `${locale}.json`))
      const common = data.common as Record<string, unknown> | undefined
      assert.ok(common, `${locale}: missing common`)
      assert.equal(
        common.ratingOnlyLabel,
        undefined,
        `${locale}.common.ratingOnlyLabel must not exist — belongs in reviews`,
      )
      assert.equal(
        common.plantsOverflow,
        undefined,
        `${locale}.common.plantsOverflow must not exist — belongs in reviews`,
      )
    }
  })

  it('unified-card review keys are present in reviews for all locales', () => {
    for (const locale of SHOP_LOCALES) {
      const reviews = loadJson(join(SHOP_ROOT, `${locale}.json`)).reviews as Record<
        string,
        unknown
      >
      for (const key of REVIEWS_P0_P2_KEYS) {
        assert.equal(
          typeof reviews[key],
          'string',
          `${locale}.reviews.${key} missing or not a string`,
        )
      }
    }
  })
})

const REVIEWS_P3_REQUEST_KEYS = [
  'addPhotos',
  'addPhotosShort',
  'photosHint',
  'photoCount',
  'photosLimit',
  'photoUploading',
  'removePhoto',
  'waitForUpload',
] as const

describe('Reviews P3 order-request photo i18n parity', () => {
  it('reviews.request photo keys exist for all six locales', () => {
    for (const locale of SHOP_LOCALES) {
      const reviews = loadJson(join(SHOP_ROOT, `${locale}.json`)).reviews as Record<
        string,
        unknown
      >
      const request = reviews.request as Record<string, unknown> | undefined
      assert.ok(request, `${locale}: missing reviews.request`)
      for (const key of REVIEWS_P3_REQUEST_KEYS) {
        assert.equal(
          typeof request[key],
          'string',
          `${locale}.reviews.request.${key} missing or not a string`,
        )
      }
      assert.match(String(request.photoCount), /\{current\}/)
      assert.match(String(request.photoCount), /\{max\}/)
      assert.match(String(request.photosLimit), /\{max\}/)
    }
  })
})
