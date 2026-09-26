/**
 * Contract vectors for Shop ↔ Backend market person-name policy.
 * Keep in sync with green-angels-backend/src/orders/market-person-name-policy.spec.ts
 *
 * Changing SK allowedScripts to include 'cyrillic' requires updating BOTH runtimes'
 * PERSON_NAME_POLICY_BY_MARKET and these expectations.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  PERSON_NAME_POLICY_BY_MARKET,
  arePersonNamesUsableForMarket,
  getPersonNameMarketFieldError,
  isPersonNameUsableForMarket,
  personNameHasDisallowedScriptForMarket,
} from './market-person-name-policy'

/** Shared Shop↔Backend vectors (document intentional twin). */
const VECTORS: Array<{
  name: string
  value: string
  sk: boolean
  ua: boolean
  note?: string
}> = [
  { name: 'empty', value: '', sk: false, ua: false },
  { name: 'whitespace', value: '   ', sk: false, ua: false },
  { name: 'ascii Latin', value: 'Jan', sk: true, ua: false },
  { name: 'Slovak diacritics Ján', value: 'Ján', sk: true, ua: false },
  { name: 'Slovak Novák', value: 'Novák', sk: true, ua: false },
  { name: 'Slovak Mária', value: 'Mária', sk: true, ua: false },
  { name: 'apostrophe O\'Connor', value: "O'Connor", sk: true, ua: false },
  { name: 'hyphen Anne-Marie', value: 'Anne-Marie', sk: true, ua: false },
  { name: 'Czech Řeřicha', value: 'Řeřicha', sk: true, ua: false },
  { name: 'Cyrillic Олена', value: 'Олена', sk: false, ua: true },
  { name: 'Cyrillic Іван', value: 'Іван', sk: false, ua: true },
  { name: 'Cyrillic Новак', value: 'Новак', sk: false, ua: true },
  {
    name: 'mixed Latin+Cyrillic',
    value: 'JanІван',
    sk: false,
    ua: false,
    note: 'rejected by both script regexes',
  },
  {
    name: 'single letter',
    value: 'A',
    sk: false,
    ua: false,
    note: 'structural min length 2',
  },
  {
    name: 'digits',
    value: 'Jan2',
    sk: false,
    ua: false,
  },
]

describe('PERSON_NAME_POLICY_BY_MARKET (current deploy)', () => {
  it('SK allows latin only; UA allows cyrillic only', () => {
    assert.deepEqual([...PERSON_NAME_POLICY_BY_MARKET.sk.allowedScripts], ['latin'])
    assert.deepEqual([...PERSON_NAME_POLICY_BY_MARKET.ua.allowedScripts], ['cyrillic'])
  })
})

describe('isPersonNameUsableForMarket contract vectors', () => {
  for (const row of VECTORS) {
    it(`${row.name}: sk=${row.sk} ua=${row.ua}`, () => {
      assert.equal(
        isPersonNameUsableForMarket(row.value, 'sk'),
        row.sk,
        row.note ?? `sk:${row.value}`,
      )
      assert.equal(
        isPersonNameUsableForMarket(row.value, 'ua'),
        row.ua,
        row.note ?? `ua:${row.value}`,
      )
    })
  }

  it('does not take UI locale — only market region', () => {
    // Helper has no locale parameter; market=sk rejects Cyrillic regardless of UI language.
    assert.equal(isPersonNameUsableForMarket('Олена', 'sk'), false)
    assert.equal(isPersonNameUsableForMarket('Ján', 'sk'), true)
  })

  it('arePersonNamesUsableForMarket requires both', () => {
    assert.equal(arePersonNamesUsableForMarket('Ján', 'Novák', 'sk'), true)
    assert.equal(arePersonNamesUsableForMarket('Ján', 'Олена', 'sk'), false)
    assert.equal(arePersonNamesUsableForMarket('Олена', 'Новак', 'ua'), true)
  })
})

describe('field errors preserve existing codes', () => {
  it('SK Cyrillic → latinCharactersRequired', () => {
    assert.equal(
      getPersonNameMarketFieldError('Олена', 'sk', 'firstName'),
      'latinCharactersRequired',
    )
  })
  it('SK too short → minLatinLetters', () => {
    assert.equal(getPersonNameMarketFieldError('A', 'sk', 'firstName'), 'minLatinLetters')
  })
  it('UA Latin first → cyrillicFirstName', () => {
    assert.equal(
      getPersonNameMarketFieldError('John', 'ua', 'firstName'),
      'cyrillicFirstName',
    )
  })
  it('UA Latin last → cyrillicLastName', () => {
    assert.equal(
      getPersonNameMarketFieldError('Smith', 'ua', 'lastName'),
      'cyrillicLastName',
    )
  })
})

describe('disallowed script helper', () => {
  it('SK treats Cyrillic as disallowed script', () => {
    assert.equal(personNameHasDisallowedScriptForMarket('Олена', 'sk'), true)
    assert.equal(personNameHasDisallowedScriptForMarket('Ján', 'sk'), false)
  })
  it('UA treats Latin as disallowed script', () => {
    assert.equal(personNameHasDisallowedScriptForMarket('John', 'ua'), true)
    assert.equal(personNameHasDisallowedScriptForMarket('Олена', 'ua'), false)
  })
})
