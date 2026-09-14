import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  presentContactBlockTitle,
  presentScheduleEntries,
  presentScheduleLabel,
  presentScheduleTitle,
  presentScheduleValue,
  type SchedulePresentationMessages,
} from './schedule-presentation'

const skMessages: SchedulePresentationMessages = {
  hours: 'Otváracie hodiny',
  contactUs: 'Kontaktujte nás',
  closed: 'Zatvorené',
  open: 'Otvorené',
  weekday: {
    mon: 'Pon',
    tue: 'Uto',
    wed: 'Str',
    thu: 'Štv',
    fri: 'Pia',
    sat: 'Sob',
    sun: 'Ned',
  },
  weekdayRange: (from, to) => `${from} – ${to}`,
}

const huMessages: SchedulePresentationMessages = {
  hours: 'Nyitvatartás',
  contactUs: 'Lépjen kapcsolatba',
  closed: 'Zárva',
  open: 'Nyitva',
  weekday: {
    mon: 'Hé',
    tue: 'Ke',
    wed: 'Sze',
    thu: 'Csü',
    fri: 'Pé',
    sat: 'Szo',
    sun: 'Vas',
  },
  weekdayRange: (from, to) => `${from} – ${to}`,
}

describe('schedule-presentation', () => {
  it('localizes hours/contact titles instead of leaking CMS language', () => {
    assert.equal(presentScheduleTitle('Otváracie hodiny', huMessages), 'Nyitvatartás')
    assert.equal(presentContactBlockTitle('Kontaktujte nás', huMessages), 'Lépjen kapcsolatba')
  })

  it('localizes weekday ranges and closed status', () => {
    assert.equal(presentScheduleLabel('Pon - Pia', huMessages), 'Hé – Pé')
    assert.equal(presentScheduleValue('Zatvorené', huMessages), 'Zárva')
    assert.deepEqual(
      presentScheduleEntries(
        [
          { label: 'Pon - Pia', value: '8:00 - 16:00' },
          { label: 'Sob - Ned', value: 'Zatvorené' },
        ],
        huMessages,
      ),
      ['Hé – Pé: 8:00 - 16:00', 'Szo – Vas: Zárva'],
    )
  })

  it('keeps unrecognized free-text data', () => {
    assert.equal(presentScheduleLabel('Garden centre desk', skMessages), 'Garden centre desk')
    assert.equal(presentScheduleValue('8:00 - 16:00', skMessages), '8:00 - 16:00')
  })
})
