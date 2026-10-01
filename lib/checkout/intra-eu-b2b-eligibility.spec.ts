import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isIntraEuB2bGoodsEligible,
  isMeaningfulViesRegisteredName,
  viesAutofillKey,
} from './intra-eu-b2b-eligibility'
import { viesVatCountryToBillingIso } from './eu-member-states'

describe('shop intra-EU B2B eligibility (UI mirror)', () => {
  it('matches backend gate: PL+SK false, PL+CZ true', () => {
    assert.equal(
      isIntraEuB2bGoodsEligible({
        buyerType: 'company',
        viesValid: true,
        vatCountryCode: 'PL',
        deliveryCountryCode: 'sk',
      }),
      false,
    )
    assert.equal(
      isIntraEuB2bGoodsEligible({
        buyerType: 'company',
        viesValid: true,
        vatCountryCode: 'PL',
        deliveryCountryCode: 'cz',
      }),
      true,
    )
  })

  it('viesAutofillKey + billing ISO mapping', () => {
    assert.equal(viesAutofillKey('PL', '1234567890'), 'PL:1234567890')
    assert.equal(viesAutofillKey('pl', '12 34'), 'PL:1234')
    assert.equal(viesVatCountryToBillingIso('PL'), 'pl')
    assert.equal(viesVatCountryToBillingIso('EL'), 'gr')
    assert.equal(isMeaningfulViesRegisteredName('---'), false)
    assert.equal(isMeaningfulViesRegisteredName('ACME s.r.o.'), true)
  })
})
