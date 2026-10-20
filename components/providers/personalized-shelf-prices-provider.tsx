'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useSession } from '@/components/providers/session-provider'
import { fetchShelfPrices, type ShelfPriceTier } from '@/lib/pricing/shelf-prices'
import {
  getBulkPriceTiersFrom,
  getUnitPriceForQuantityFrom,
} from '@/lib/product-pricing'
import { fetchPublicSiteSettingsFromApiRoute, getMarketSettings } from '@/lib/settings/fetch'
import type { PriceTier, ProductVariant } from '@/lib/types'

type PersonalizedVariantPricing = {
  /** qty=1 personalized unit (Sales Prices). */
  unitPrice: number
  /** Full ladder including qty=1 — server-resolved. */
  priceTiers: PriceTier[]
  scope: string
}

type ShelfPricesContextValue = {
  /** Resolved unit price for variant (qty=1), or undefined if not loaded / not applicable. */
  getUnitPrice: (variantId: string) => number | undefined
  /** Server ladder for variant, or undefined when fallback to Product Card. */
  getPriceTiers: (variantId: string) => PriceTier[] | undefined
  /** Register variant ids visible on screen for batched fetch. */
  registerVariantIds: (variantIds: string[]) => void
  /** True while a wholesale personalized fetch is in flight. */
  loading: boolean
  /** True when session is wholesale and SALES_PRICES mode is active. */
  active: boolean
}

const ShelfPricesContext = createContext<ShelfPricesContextValue | null>(null)

function tiersFromShelf(rows: ShelfPriceTier[]): PriceTier[] {
  return rows
    .filter((t) => t.minQuantity > 0 && t.unitPrice > 0)
    .map((t) => ({ minQuantity: t.minQuantity, pricePerUnit: t.unitPrice }))
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

export function PersonalizedShelfPricesProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const isWholesale = user?.accountType === 'wholesale'
  /** Any authenticated customer — private commercial ladder (retail REGISTERED_ONLY / wholesale dual-offer). */
  const isAuthenticated = Boolean(user?.id)
  const [salesPricesMode, setSalesPricesMode] = useState(false)
  const [byVariant, setByVariant] = useState<Map<string, PersonalizedVariantPricing>>(
    () => new Map(),
  )
  const [loading, setLoading] = useState(false)
  const pendingIds = useRef(new Set<string>())
  const loadedIds = useRef(new Set<string>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userKey = user?.id ?? ''

  useEffect(() => {
    let cancelled = false
    void fetchPublicSiteSettingsFromApiRoute()
      .then((settings) => {
        if (cancelled) return
        const market = getMarketSettings(settings)
        setSalesPricesMode(market.priceSource === 'SALES_PRICES')
      })
      .catch(() => {
        if (!cancelled) setSalesPricesMode(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Clear personalized map on logout / user switch / market priceSource change.
  useEffect(() => {
    setByVariant(new Map())
    pendingIds.current = new Set()
    loadedIds.current = new Set()
  }, [userKey, isWholesale, salesPricesMode])

  const flush = useCallback(async () => {
    // Authenticated sessions only — guests keep public SSR ladders (no private cache).
    // WHOLESALER: dual-offer ladder; retail USER: retail commercial (REGISTERED_ONLY etc.).
    if (!isAuthenticated) return
    const ids = [...pendingIds.current].filter((id) => !loadedIds.current.has(id))
    pendingIds.current = new Set()
    if (!ids.length) return

    setLoading(true)
    try {
      const result = await fetchShelfPrices(ids)
      setByVariant((prev) => {
        const next = new Map(prev)
        for (const item of result.items) {
          if (item.unitPrice > 0) {
            const ladder =
              item.quantityTiers.length > 0
                ? tiersFromShelf(item.quantityTiers)
                : [{ minQuantity: 1, pricePerUnit: item.unitPrice }]
            next.set(item.productVariantId, {
              unitPrice: item.unitPrice,
              priceTiers: ladder,
              scope: item.scope,
            })
          }
          loadedIds.current.add(item.productVariantId)
        }
        // Mark requested ids as loaded even if unsellable / fallback (avoid refetch storms).
        for (const id of ids) loadedIds.current.add(id)
        return next
      })
    } catch {
      // Keep SSR Product Card on failure.
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const registerVariantIds = useCallback(
    (variantIds: string[]) => {
      if (!isAuthenticated) return
      let added = false
      for (const id of variantIds) {
        if (!id || loadedIds.current.has(id) || pendingIds.current.has(id)) continue
        pendingIds.current.add(id)
        added = true
      }
      if (!added) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void flush()
      }, 50)
    },
    [flush, isAuthenticated],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const value = useMemo<ShelfPricesContextValue>(
    () => ({
      getUnitPrice: (variantId) => byVariant.get(variantId)?.unitPrice,
      getPriceTiers: (variantId) => byVariant.get(variantId)?.priceTiers,
      registerVariantIds,
      loading,
      active: isAuthenticated,
    }),
    [byVariant, registerVariantIds, loading, isAuthenticated],
  )

  return <ShelfPricesContext.Provider value={value}>{children}</ShelfPricesContext.Provider>
}

export function usePersonalizedShelfPrices() {
  const ctx = useContext(ShelfPricesContext)
  if (!ctx) {
    return {
      getUnitPrice: () => undefined as number | undefined,
      getPriceTiers: () => undefined as PriceTier[] | undefined,
      registerVariantIds: (_ids: string[]) => {},
      loading: false,
      active: false,
    }
  }
  return ctx
}

/** Prefer personalized wholesale unit price (qty=1) when available. */
export function useDisplayUnitPrice(variantId: string | undefined, fallback: number): number {
  const { getUnitPrice, registerVariantIds, active } = usePersonalizedShelfPrices()
  useEffect(() => {
    if (active && variantId) registerVariantIds([variantId])
  }, [active, variantId, registerVariantIds])
  if (!variantId) return fallback
  const personalized = getUnitPrice(variantId)
  return personalized != null && personalized > 0 ? personalized : fallback
}

/**
 * Effective display pricing for a variant:
 * Commercial ladder is SoT (server-resolved absolute unit prices).
 * - Authenticated → private shelf ladder (retail REGISTERED_ONLY / WHOLESALER dual-offer)
 * - Guest → SSR catalog/PDP priceTiers (public retail commercial only)
 */
export function useVariantDisplayPricing(variant: ProductVariant) {
  const { getUnitPrice, getPriceTiers, registerVariantIds, active } =
    usePersonalizedShelfPrices()

  useEffect(() => {
    if (active && variant.id) registerVariantIds([variant.id])
  }, [active, variant.id, registerVariantIds])

  const personalizedUnit = getUnitPrice(variant.id)
  const personalizedTiers = getPriceTiers(variant.id)
  const hasPersonalizedLadder =
    active &&
    personalizedUnit != null &&
    personalizedUnit > 0 &&
    Array.isArray(personalizedTiers) &&
    personalizedTiers.length > 0

  const basePrice = hasPersonalizedLadder ? personalizedUnit : variant.basePrice
  const priceTiers = hasPersonalizedLadder ? personalizedTiers : variant.priceTiers
  const bulkTiers = getBulkPriceTiersFrom(basePrice, priceTiers, {
    maxPurchasableQty: variant.stock,
  })

  return {
    basePrice,
    priceTiers,
    bulkTiers,
    usingSalesPrices: hasPersonalizedLadder,
    getUnitPrice: (quantity: number) =>
      getUnitPriceForQuantityFrom(basePrice, priceTiers, quantity),
  }
}
