'use client'

import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { HomeSectionOrderControls } from '@/components/backstage/home-section-order-controls'
import { HeroImageField } from '@/components/backstage/hero-image-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isHomeHeroMobileImagePath } from '@/lib/media/paths'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type {
  HomeGalleryImage,
  HomeHighlight,
  HomePageSettings,
  HomeStat,
} from '@/lib/settings/types'

function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function listToLines(items: string[]): string {
  return items.join('\n')
}

export function HomePageSettingsForm({
  settings: home,
  onChange,
  onSave,
  saving,
  isDirty,
}: {
  settings: HomePageSettings
  onChange: (next: HomePageSettings) => void
  onSave: () => void
  saving: boolean
  isDirty: boolean
}) {
  const tBanner = useTranslations('contentBanner')

  const setHome = onChange

  const updateHeroHighlight = (index: number, patch: Partial<HomeHighlight>) => {
    const highlights = home.hero.highlights.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    setHome({ ...home, hero: { ...home.hero, highlights } })
  }

  const updateStat = (index: number, patch: Partial<HomeStat>) => {
    const stats = home.whyUs.stats.map((item, i) => (i === index ? { ...item, ...patch } : item))
    setHome({ ...home, whyUs: { ...home.whyUs, stats } })
  }

  const updateGalleryImage = (index: number, patch: Partial<HomeGalleryImage>) => {
    const images = home.nurseryGallery.images.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    setHome({ ...home, nurseryGallery: { ...home.nurseryGallery, images } })
  }

  const addGalleryImage = () => {
    setHome({
      ...home,
      nurseryGallery: {
        ...home.nurseryGallery,
        images: [...home.nurseryGallery.images, { url: '', caption: '' }],
      },
    })
  }

  const removeGalleryImage = (index: number) => {
    setHome({
      ...home,
      nurseryGallery: {
        ...home.nurseryGallery,
        images: home.nurseryGallery.images.filter((_, i) => i !== index),
      },
    })
  }

  return (
    <div className="space-y-6">
  <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
    {tBanner('cmsNotTranslated')}
  </p>
  <HomeSectionOrderControls
    order={home.sectionOrder}
    hidden={home.sectionHidden}
    onChange={({ sectionOrder, sectionHidden }) =>
      setHome({
        ...home,
        sectionOrder,
        sectionHidden,
        reviews: { ...home.reviews, enabled: !sectionHidden.includes('reviews') },
        freshPlantPhotos: {
          ...home.freshPlantPhotos,
          enabled: !sectionHidden.includes('freshPlantPhotos'),
        },
      })
    }
  />

  <Card>
    <CardHeader>
      <CardTitle>Хіро-блок</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Бейдж</Label>
        <Input
          value={home.hero.badge}
          onChange={(e) =>
            setHome({ ...home, hero: { ...home.hero, badge: e.target.value } })
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input
            value={home.hero.title}
            onChange={(e) =>
              setHome({ ...home, hero: { ...home.hero, title: e.target.value } })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Акцент у заголовку</Label>
          <Input
            value={home.hero.titleAccent}
            onChange={(e) =>
              setHome({ ...home, hero: { ...home.hero, titleAccent: e.target.value } })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={3}
          value={home.hero.subtitle}
          onChange={(e) =>
            setHome({ ...home, hero: { ...home.hero, subtitle: e.target.value } })
          }
        />
      </div>
      <HeroImageField
        imageUrl={home.hero.imageUrl}
        onImageUrlChange={(imageUrl) =>
          setHome({ ...home, hero: { ...home.hero, imageUrl } })
        }
      />
      <HeroImageField
        label="Зображення хіро (мобільне)"
        emptyHint="Опційно. Якщо не завантажено — на мобільному показується основне зображення."
        filledHint="Мобільне зображення в R2. Після заміни або видалення натисніть «Зберегти головну»."
        uploadPath="/api/backstage/settings/home-hero-mobile/upload"
        deletePath="/api/backstage/settings/home-hero-mobile/delete"
        isStoredPath={isHomeHeroMobileImagePath}
        imageUrl={home.hero.mobileImageUrl ?? ''}
        onImageUrlChange={(mobileImageUrl) =>
          setHome({ ...home, hero: { ...home.hero, mobileImageUrl } })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Кнопка 1 — текст</Label>
          <Input
            value={home.hero.primaryCtaLabel}
            onChange={(e) =>
              setHome({ ...home, hero: { ...home.hero, primaryCtaLabel: e.target.value } })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кнопка 1 — посилання</Label>
          <Input
            value={home.hero.primaryCtaHref}
            onChange={(e) =>
              setHome({ ...home, hero: { ...home.hero, primaryCtaHref: e.target.value } })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кнопка 2 — текст</Label>
          <Input
            value={home.hero.secondaryCtaLabel}
            onChange={(e) =>
              setHome({
                ...home,
                hero: { ...home.hero, secondaryCtaLabel: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кнопка 2 — посилання</Label>
          <Input
            value={home.hero.secondaryCtaHref}
            onChange={(e) =>
              setHome({
                ...home,
                hero: { ...home.hero, secondaryCtaHref: e.target.value },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label>Переваги (3 блоки)</Label>
        {home.hero.highlights.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <Input
              placeholder="Заголовок"
              value={item.title}
              onChange={(e) => updateHeroHighlight(index, { title: e.target.value })}
            />
            <Input
              placeholder="Опис"
              value={item.description}
              onChange={(e) => updateHeroHighlight(index, { description: e.target.value })}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Категорії на головній</CardTitle>
      <CardDescription>
        Заголовок і підзаголовок блоку категорій. Категорії показуються в горизонтальному скролі.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок блоку</Label>
          <Input
            value={home.categories.title}
            onChange={(e) =>
              setHome({
                ...home,
                categories: { ...home.categories, title: e.target.value },
              })
            }
            placeholder="Напр. Каталог"
          />
        </div>
        <div className="space-y-2">
          <Label>Максимум категорій (якщо slugs порожні)</Label>
          <Input
            type="number"
            min={1}
            max={24}
            value={home.categories.limit}
            onChange={(e) =>
              setHome({
                ...home,
                categories: {
                  ...home.categories,
                  limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.categories.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок блоку</Label>
        <Textarea
          rows={2}
          value={home.categories.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              categories: { ...home.categories, subtitle: e.target.value },
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Slugs категорій (по одному в рядку, порядок відображення)</Label>
        <Textarea
          rows={4}
          value={listToLines(home.categories.categorySlugs ?? [])}
          onChange={(e) =>
            setHome({
              ...home,
              categories: {
                ...home.categories,
                categorySlugs: linesToList(e.target.value),
              },
            })
          }
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Новинки</CardTitle>
      <CardDescription>
        Автоматично: товари, що знову зʼявились у наявності після повного відсутності на складі.
        Slugs додаються вручну на початок списку.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input
            value={home.newArrivals.title}
            onChange={(e) =>
              setHome({
                ...home,
                newArrivals: { ...home.newArrivals, title: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кількість карток</Label>
          <Input
            type="number"
            min={3}
            max={12}
            value={home.newArrivals.limit}
            onChange={(e) =>
              setHome({
                ...home,
                newArrivals: {
                  ...home.newArrivals,
                  limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.newArrivals.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.newArrivals.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              newArrivals: { ...home.newArrivals, subtitle: e.target.value },
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
        <Textarea
          rows={3}
          value={listToLines(home.newArrivals.productSlugs)}
          onChange={(e) =>
            setHome({
              ...home,
              newArrivals: {
                ...home.newArrivals,
                productSlugs: linesToList(e.target.value),
              },
            })
          }
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Популярний вибір</CardTitle>
      <CardDescription>
        Автоматично: найбільше продано за останні 90 днів (лише в наявності). Slugs — ручний
        пріоритет.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input
            value={home.bestsellers.title}
            onChange={(e) =>
              setHome({
                ...home,
                bestsellers: { ...home.bestsellers, title: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кількість карток</Label>
          <Input
            type="number"
            min={3}
            max={12}
            value={home.bestsellers.limit}
            onChange={(e) =>
              setHome({
                ...home,
                bestsellers: {
                  ...home.bestsellers,
                  limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.bestsellers.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.bestsellers.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              bestsellers: { ...home.bestsellers, subtitle: e.target.value },
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
        <Textarea
          rows={3}
          value={listToLines(home.bestsellers.productSlugs)}
          onChange={(e) =>
            setHome({
              ...home,
              bestsellers: {
                ...home.bestsellers,
                productSlugs: linesToList(e.target.value),
              },
            })
          }
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Закінчується</CardTitle>
      <CardDescription>
        Автоматично: в наявності, але залишок не більше порогу (сортування від меншого залишку).
        Slugs — ручні позиції на початку.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>Заголовок</Label>
          <Input
            value={home.lowStock.title}
            onChange={(e) =>
              setHome({
                ...home,
                lowStock: { ...home.lowStock, title: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кількість карток</Label>
          <Input
            type="number"
            min={3}
            max={12}
            value={home.lowStock.limit}
            onChange={(e) =>
              setHome({
                ...home,
                lowStock: {
                  ...home.lowStock,
                  limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.lowStock.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.lowStock.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              lowStock: { ...home.lowStock, subtitle: e.target.value },
            })
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Поріг залишку (шт., для авто-відбору)</Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={home.lowStock.stockThreshold}
            onChange={(e) =>
              setHome({
                ...home,
                lowStock: {
                  ...home.lowStock,
                  stockThreshold:
                    Number(e.target.value) || DEFAULT_HOME_SETTINGS.lowStock.stockThreshold,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
        <Textarea
          rows={3}
          value={listToLines(home.lowStock.productSlugs)}
          onChange={(e) =>
            setHome({
              ...home,
              lowStock: {
                ...home.lowStock,
                productSlugs: linesToList(e.target.value),
              },
            })
          }
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Чому обирають нас</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Заголовок</Label>
        <Input
          value={home.whyUs.title}
          onChange={(e) =>
            setHome({ ...home, whyUs: { ...home.whyUs, title: e.target.value } })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={3}
          value={home.whyUs.subtitle}
          onChange={(e) =>
            setHome({ ...home, whyUs: { ...home.whyUs, subtitle: e.target.value } })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Переваги (по одній в рядку)</Label>
        <Textarea
          rows={6}
          value={listToLines(home.whyUs.features)}
          onChange={(e) =>
            setHome({
              ...home,
              whyUs: { ...home.whyUs, features: linesToList(e.target.value) },
            })
          }
        />
      </div>
      <div className="space-y-3">
        <Label>Статистика</Label>
        {home.whyUs.stats.map((stat, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <Input
              placeholder="Значення"
              value={stat.value}
              onChange={(e) => updateStat(index, { value: e.target.value })}
            />
            <Input
              placeholder="Підпис"
              value={stat.label}
              onChange={(e) => updateStat(index, { label: e.target.value })}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Галерея розсадника</CardTitle>
      <Button type="button" size="sm" variant="outline" onClick={addGalleryImage}>
        <Plus className="mr-1 h-4 w-4" />
        Фото
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Заголовок</Label>
        <Input
          value={home.nurseryGallery.title}
          onChange={(e) =>
            setHome({
              ...home,
              nurseryGallery: { ...home.nurseryGallery, title: e.target.value },
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.nurseryGallery.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              nurseryGallery: { ...home.nurseryGallery, subtitle: e.target.value },
            })
          }
        />
      </div>
      {home.nurseryGallery.images.map((image, index) => (
        <div key={index} className="flex gap-2 rounded-lg border p-3">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <Input
              placeholder="URL зображення"
              value={image.url}
              onChange={(e) => updateGalleryImage(index, { url: e.target.value })}
            />
            <Input
              placeholder="Підпис"
              value={image.caption}
              onChange={(e) => updateGalleryImage(index, { caption: e.target.value })}
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => removeGalleryImage(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Актуальні фото рослин</CardTitle>
      <CardDescription>
        Горизонтальна стрічка свіжих фото з розсадника. Дані підтягуються автоматично з
        каталогу фото.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input
            value={home.freshPlantPhotos.title}
            onChange={(e) =>
              setHome({
                ...home,
                freshPlantPhotos: { ...home.freshPlantPhotos, title: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кількість фото</Label>
          <Input
            type="number"
            min={3}
            max={24}
            value={home.freshPlantPhotos.limit}
            onChange={(e) =>
              setHome({
                ...home,
                freshPlantPhotos: {
                  ...home.freshPlantPhotos,
                  limit:
                    Number(e.target.value) ||
                    DEFAULT_HOME_SETTINGS.freshPlantPhotos.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.freshPlantPhotos.subtitle}
          onChange={(e) =>
            setHome({
              ...home,
              freshPlantPhotos: { ...home.freshPlantPhotos, subtitle: e.target.value },
            })
          }
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Відгуки</CardTitle>
      <CardDescription>
        Реальні відгуки клієнтів після модерації. Керування текстами — у розділі «Відгуки».
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок</Label>
          <Input
            value={home.reviews.title}
            onChange={(e) =>
              setHome({ ...home, reviews: { ...home.reviews, title: e.target.value } })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Кількість відгуків</Label>
          <Input
            type="number"
            min={3}
            max={20}
            value={home.reviews.limit}
            onChange={(e) =>
              setHome({
                ...home,
                reviews: {
                  ...home.reviews,
                  limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.reviews.limit,
                },
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Підзаголовок</Label>
        <Textarea
          rows={2}
          value={home.reviews.subtitle}
          onChange={(e) =>
            setHome({ ...home, reviews: { ...home.reviews, subtitle: e.target.value } })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reviews-sort">Сортування</Label>
        <select
          id="reviews-sort"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={home.reviews.sort}
          onChange={(e) =>
            setHome({
              ...home,
              reviews: {
                ...home.reviews,
                sort: e.target.value as HomePageSettings['reviews']['sort'],
              },
            })
          }
        >
          <option value="newest">Спочатку нові</option>
          <option value="oldest">Спочатку старі</option>
          <option value="rating_desc">Спочатку з найвищою оцінкою</option>
        </select>
      </div>
    </CardContent>
  </Card>

  <Button
    type="button"
    onClick={() => void onSave()}
    disabled={saving || !isDirty}
  >
    {saving ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Save className="mr-2 h-4 w-4" />
    )}
    Зберегти головну
  </Button>
    </div>
  )
}
