import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EMPTY_STORE_CONTACT_CMS,
  getStoreContactCmsForEdit,
  isBlankStoreContactCms,
  normalizeStoreContactByLocale,
  resolveStoreContactForLocale,
  syncStoreCmsStructureAcrossLocales,
} from './store-contact-cms'
import { normalizeStoreContactSettings } from './store-contact.normalize'

describe('store-contact-cms byLocale', () => {
  it('migrates legacy flat address/blocks/schedules into primary locale', () => {
    const byLocale = normalizeStoreContactByLocale(
      undefined,
      {
        addressLine1: 'вул. Садова 1',
        addressLine2: 'Київ',
        contactBlocks: [
          { title: 'Підтримка', lines: [{ type: 'phone', value: '+380501112233' }] },
        ],
        schedules: [{ title: 'Графік', entries: [{ label: 'Пн-Пт', value: '9-18' }] }],
      },
      'ua',
    )

    assert.ok(byLocale.uk)
    assert.equal(byLocale.uk!.addressLine1, 'вул. Садова 1')
    assert.equal(byLocale.uk!.contactBlocks[0]?.title, 'Підтримка')
    assert.equal(byLocale.uk!.schedules[0]?.entries[0]?.value, '9-18')
    assert.equal(byLocale.sk, undefined)
  })

  it('resolve blank locale keeps shared maps and falls back to flat legacy', () => {
    const store = normalizeStoreContactSettings(
      {
        addressLine1: 'Flat addr',
        mapsUrl: 'https://maps.example/x',
        contactBlocks: [{ title: 'Support', lines: [{ type: 'email', value: 'a@b.c' }] }],
        byLocale: {
          uk: {
            addressLine1: 'UK addr',
            addressLine2: '',
            contactBlocks: [
              { title: 'UK support', lines: [{ type: 'email', value: 'uk@b.c' }] },
            ],
            schedules: [],
          },
        },
      },
      'ua',
    )

    const uk = resolveStoreContactForLocale(store, 'uk')
    assert.equal(uk.addressLine1, 'UK addr')
    assert.equal(uk.emails[0]?.email, 'uk@b.c')
    assert.equal(uk.mapsUrl, 'https://maps.example/x')

    const en = resolveStoreContactForLocale(store, 'en')
    // Blank/missing locale keeps flat shell (legacy fallback), not empty wipe
    assert.equal(en.addressLine1, store.addressLine1)
    assert.equal(isBlankStoreContactCms(EMPTY_STORE_CONTACT_CMS), true)
  })

  it('edit fallback shows primary locale blocks instead of empty', () => {
    const store = normalizeStoreContactSettings(
      {
        mapsUrl: 'https://maps.example/x',
        byLocale: {
          sk: {
            addressLine1: 'Bratislava',
            addressLine2: '',
            contactBlocks: [
              { title: 'Podpora', lines: [{ type: 'phone', value: '+421900' }] },
            ],
            schedules: [{ title: 'Hodiny', entries: [{ label: 'Po-Pia', value: '9-17' }] }],
          },
        },
      },
      'sk',
    )
    const hu = getStoreContactCmsForEdit(store, 'hu', 'sk')
    assert.equal(hu.addressLine1, 'Bratislava')
    assert.equal(hu.contactBlocks.length, 1)
    assert.equal(hu.contactBlocks[0]?.lines[0]?.value, '+421900')

    const synced = syncStoreCmsStructureAcrossLocales(store.byLocale, 'sk', hu)
    assert.ok(synced.hu)
    assert.equal(synced.hu!.contactBlocks.length, 1)
  })

  it('preserves per-locale schedule closed/hours values across structure sync', () => {
    const byLocale = {
      sk: {
        addressLine1: 'Bratislava',
        addressLine2: '',
        contactBlocks: [],
        schedules: [
          {
            title: 'Otváracie hodiny',
            entries: [
              { label: 'Po–Pia', value: '9:00–17:00' },
              { label: 'So–Ne', value: 'Zatvorené' },
            ],
            note: '',
          },
        ],
      },
      hu: {
        addressLine1: 'Pozsony',
        addressLine2: '',
        contactBlocks: [],
        schedules: [
          {
            title: 'Nyitvatartás',
            entries: [
              { label: 'H–P', value: '9:00–17:00' },
              { label: 'Szo–V', value: 'Zárva' },
            ],
            note: '',
          },
        ],
      },
      de: {
        addressLine1: 'Pressburg',
        addressLine2: '',
        contactBlocks: [],
        schedules: [
          {
            title: 'Öffnungszeiten',
            entries: [
              { label: 'Mo–Fr', value: '9:00–17:00' },
              { label: 'Sa–So', value: 'Geschlossen' },
            ],
            note: '',
          },
        ],
      },
    }

    const source = byLocale.sk
    const synced = syncStoreCmsStructureAcrossLocales(byLocale, 'sk', source)

    assert.equal(synced.sk!.schedules[0]!.entries[1]!.value, 'Zatvorené')
    assert.equal(synced.hu!.schedules[0]!.entries[1]!.value, 'Zárva')
    assert.equal(synced.de!.schedules[0]!.entries[1]!.value, 'Geschlossen')
    assert.equal(synced.hu!.schedules[0]!.entries[1]!.label, 'Szo–V')
    assert.equal(synced.de!.schedules[0]!.entries[1]!.label, 'Sa–So')
    // Phones/emails stay shared from source when structure sync runs on contact lines
  })
})
