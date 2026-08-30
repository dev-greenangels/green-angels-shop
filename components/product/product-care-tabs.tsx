'use client'

import { useTranslations } from 'next-intl'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type ProductCareTabsProps = {
  plantingInstructions?: string | null
  lightRequirements?: string | null
  careInstructions?: string | null
}

export function ProductCareTabs({
  plantingInstructions,
  lightRequirements,
  careInstructions,
}: ProductCareTabsProps) {
  const t = useTranslations('product')

  const hasPlanting = Boolean(plantingInstructions?.trim())
  const hasLight = Boolean(lightRequirements?.trim())
  const hasCare = Boolean(careInstructions?.trim())

  if (!hasPlanting && !hasLight && !hasCare) return null

  return (
    <div className="mb-16">
      <Tabs defaultValue="planting" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          {hasPlanting ? (
            <TabsTrigger
              value="planting"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('planting')}
            </TabsTrigger>
          ) : null}
          {hasLight ? (
            <TabsTrigger
              value="light"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('lighting')}
            </TabsTrigger>
          ) : null}
          {hasCare ? (
            <TabsTrigger
              value="care"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('care')}
            </TabsTrigger>
          ) : null}
        </TabsList>
        {hasPlanting ? (
          <TabsContent value="planting" className="mt-0">
            <div className="rounded-xl bg-secondary/30 p-6">
              <h3 className="mb-4 font-serif text-xl font-semibold">{t('plantingInstructions')}</h3>
              <p className="leading-relaxed text-muted-foreground">{plantingInstructions}</p>
            </div>
          </TabsContent>
        ) : null}
        {hasLight ? (
          <TabsContent value="light" className="mt-0">
            <div className="rounded-xl bg-secondary/30 p-6">
              <h3 className="mb-4 font-serif text-xl font-semibold">{t('lightingRequirements')}</h3>
              <p className="leading-relaxed text-muted-foreground">{lightRequirements}</p>
            </div>
          </TabsContent>
        ) : null}
        {hasCare ? (
          <TabsContent value="care" className="mt-0">
            <div className="rounded-xl bg-secondary/30 p-6">
              <h3 className="mb-4 font-serif text-xl font-semibold">{t('careInstructions')}</h3>
              <p className="leading-relaxed text-muted-foreground">{careInstructions}</p>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
