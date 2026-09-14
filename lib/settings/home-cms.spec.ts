import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EMPTY_HOME_CMS,
  getHomeCmsCopyForEdit,
  isBlankHomeCms,
  normalizeHomeByLocale,
  resolveHomePageForLocale,
} from './home-cms'
import { DEFAULT_HOME_SETTINGS } from './defaults'
import { normalizeHomeSettings } from './home.normalize'

describe('home-cms byLocale', () => {
  it('migrates legacy flat texts into primary locale byLocale', () => {
    const byLocale = normalizeHomeByLocale(
      undefined,
      {
        hero: {
          badge: 'Badge',
          title: 'Legacy title',
          titleAccent: 'accent',
          subtitle: 'sub',
          primaryCtaLabel: 'Go',
          secondaryCtaLabel: 'More',
          highlights: [{ title: 'H', description: 'D' }],
        },
        categories: { title: 'Cat', subtitle: 'Cat sub' },
        newArrivals: { title: 'New', subtitle: '' },
        bestsellers: { title: 'Best', subtitle: '' },
        lowStock: { title: 'Low', subtitle: '' },
        whyUs: { title: 'Why', subtitle: '', features: [], stats: [] },
        nurseryGallery: {
          title: 'Gallery',
          subtitle: '',
          images: [{ url: '/a.jpg', caption: 'Cap' }],
        },
        freshPlantPhotos: { title: 'Fresh', subtitle: '' },
        reviews: { title: 'Reviews', subtitle: '' },
      },
      'ua',
    )

    assert.ok(byLocale.uk)
    assert.equal(byLocale.uk!.hero.title, 'Legacy title')
    assert.equal(byLocale.uk!.nurseryGallery.imageCaptions[0], 'Cap')
    assert.equal(byLocale.sk, undefined)
  })

  it('SK region migrates legacy into sk primary locale', () => {
    const byLocale = normalizeHomeByLocale(
      {},
      {
        hero: { title: 'SK legacy' },
        categories: {},
        newArrivals: {},
        bestsellers: {},
        lowStock: {},
        whyUs: {},
        nurseryGallery: { images: [] },
        freshPlantPhotos: {},
        reviews: {},
      },
      'sk',
    )
    assert.ok(byLocale.sk)
    assert.equal(byLocale.sk!.hero.title, 'SK legacy')
    assert.equal(byLocale.uk, undefined)
  })

  it('resolve blank locale blanks CMS texts for i18n fallthrough', () => {
    const settings = normalizeHomeSettings(
      {
        hero: {
          ...DEFAULT_HOME_SETTINGS.hero,
          title: 'Primary',
          imageUrl: '/hero.jpg',
          primaryCtaHref: '/catalog',
        },
        byLocale: {
          uk: {
            ...EMPTY_HOME_CMS,
            hero: { ...EMPTY_HOME_CMS.hero, title: 'UK title' },
          },
        },
      },
      'ua',
    )

    const en = resolveHomePageForLocale(settings, 'en')
    assert.equal(en.hero.title, '')
    assert.equal(en.hero.imageUrl, settings.hero.imageUrl)
    assert.equal(en.hero.primaryCtaHref, settings.hero.primaryCtaHref)
    assert.equal(isBlankHomeCms(EMPTY_HOME_CMS), true)

    const uk = resolveHomePageForLocale(settings, 'uk')
    assert.equal(uk.hero.title, 'UK title')
  })

  it('edit fallback uses primary locale instead of empty', () => {
    const settings = {
      ...DEFAULT_HOME_SETTINGS,
      byLocale: {
        sk: {
          ...EMPTY_HOME_CMS,
          hero: { ...EMPTY_HOME_CMS.hero, title: 'SK title' },
        },
      },
    }
    const hu = getHomeCmsCopyForEdit(settings, 'hu', 'sk')
    assert.equal(hu.hero.title, 'SK title')
  })
})
