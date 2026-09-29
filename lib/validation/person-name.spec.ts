import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isValidPersonName, sanitizePersonName } from './person-name'
import {
  isValidReviewFullName,
  sanitizeReviewFullName,
  validateReviewFullName,
} from './review-form'

const VALID_NAMES = [
  'Martin',
  'Ján',
  'Štefan',
  'Mária',
  'Łukasz',
  'François',
  'Müller',
  "O'Connor",
  'Anna-Maria',
  'Олена',
  'Іван',
] as const

describe('person-name / review author name', () => {
  for (const name of VALID_NAMES) {
    it(`accepts ${name}`, () => {
      assert.equal(isValidPersonName(name), true, `person: ${name}`)
      assert.equal(isValidReviewFullName(name), true, `review: ${name}`)
      assert.equal(validateReviewFullName(name), null)
      assert.equal(sanitizeReviewFullName(name), name)
    })
  }

  it('rejects empty', () => {
    assert.equal(isValidPersonName(''), false)
    assert.equal(validateReviewFullName(''), 'reviewFullNameRequired')
    assert.equal(validateReviewFullName('   '), 'reviewFullNameRequired')
  })

  it('rejects digits-only', () => {
    assert.equal(isValidPersonName('12345'), false)
    assert.equal(sanitizePersonName('12345'), '')
    assert.equal(validateReviewFullName('12345'), 'reviewFullNameInvalid')
  })

  it('rejects emoji-only', () => {
    assert.equal(isValidPersonName('😀😀'), false)
    assert.equal(sanitizePersonName('😀😀'), '')
    assert.equal(validateReviewFullName('😀😀'), 'reviewFullNameInvalid')
  })

  it('rejects angle brackets / HTML-ish input', () => {
    assert.equal(isValidPersonName('<>'), false)
    assert.equal(sanitizePersonName('<>'), '')
    assert.equal(sanitizeReviewFullName('A<b>'), 'Ab')
    assert.equal(isValidPersonName(sanitizePersonName('<script>')), true) // letters remain after strip
    assert.equal(isValidPersonName('<Martin>'), false) // raw brackets invalid before sanitize
  })

  it('rejects punctuation-only', () => {
    assert.equal(isValidPersonName("'-."), false)
    assert.equal(isValidPersonName('---'), false)
    assert.equal(validateReviewFullName("'-."), 'reviewFullNameInvalid')
  })

  it('strips digits and keeps letters while typing', () => {
    assert.equal(sanitizeReviewFullName('Martin9'), 'Martin')
    assert.equal(sanitizeReviewFullName('Олена2'), 'Олена')
  })
})
