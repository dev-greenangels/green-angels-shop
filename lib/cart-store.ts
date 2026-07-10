'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import {
  findVariantOnPlant,
  getCartLineQuantity,
  getPlantLineMaxQuantity,
} from '@/lib/cart-limits'
import { getInStockCartItems } from '@/lib/cart-availability'
import { refreshCartItemPlants } from '@/lib/cart-refresh'
import {
  cartLineKey,
  normalizeCartItems,
} from '@/lib/cart-normalize'
import { isProductVariantUuid } from '@/lib/pricing/quote-line-items'
import type { Plant, CartItem, ProductVariant } from './types'

export { cartLineKey } from '@/lib/cart-normalize'

export type AddToCartOptions = {
  variant: ProductVariant
  unitPrice?: number
}

export type AddToCartResult = {
  added: number
  quantityInCart: number
  maxQuantity: number
  wasCapped: boolean
}

export const CART_STORAGE_VERSION = 3

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  promoCode: string
  appliedPromoCodes: string[]
  personalDiscountPercent: number
  serverSyncPaused: boolean
  hasHydratedFromServer: boolean
  setPersonalDiscountPercent: (percent: number) => void
  setPromoCode: (code: string) => void
  setAppliedPromoCodes: (codes: string[]) => void
  removePromoCode: (code: string) => void
  clearPromoCode: () => void
  addItem: (plant: Plant, quantity: number | undefined, options: AddToCartOptions) => AddToCartResult
  removeItem: (plantId: string, variantId: string) => void
  updateQuantity: (plantId: string, quantity: number, variantId: string) => void
  clearCart: () => void
  replaceItems: (items: CartItem[]) => void
  setServerSyncPaused: (paused: boolean) => void
  setHasHydratedFromServer: (hydrated: boolean) => void
  openCart: () => void
  closeCart: () => void
  setCartOpen: (open: boolean) => void
  toggleCart: () => void
  refreshCatalogData: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
}

export function computeCartSubtotal(items: CartItem[]): number {
  return getInStockCartItems(items).reduce((total, item) => {
    const price = item.unitPrice ?? item.plant.price
    return total + price * item.quantity
  }, 0)
}

export function computeCartTotalPrice(
  items: CartItem[],
  personalDiscountPercent = 0
): number {
  const subtotal = computeCartSubtotal(items)
  if (personalDiscountPercent <= 0) return subtotal
  return Math.round(subtotal * (1 - personalDiscountPercent / 100))
}

export function computeCartTotalItems(items: CartItem[]): number {
  return getInStockCartItems(items).reduce((total, item) => total + item.quantity, 0)
}

function mergePersistedCart(persisted: unknown): {
  promoCode?: string
  appliedPromoCodes?: string[]
} {
  const state = persisted as {
    promoCode?: string
    appliedPromoCode?: string
    appliedPromoCodes?: string[]
  } | undefined

  const legacyCode = state?.appliedPromoCode?.trim().toUpperCase()
  const codes = (state?.appliedPromoCodes ?? [])
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)

  if (legacyCode && !codes.includes(legacyCode)) {
    codes.unshift(legacyCode)
  }

  return {
    promoCode: state?.promoCode ?? '',
    appliedPromoCodes: [...new Set(codes)],
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      promoCode: '',
      appliedPromoCodes: [],
      personalDiscountPercent: 0,
      serverSyncPaused: false,
      hasHydratedFromServer: false,

      setPersonalDiscountPercent: (percent) =>
        set({ personalDiscountPercent: Math.max(0, Math.min(100, percent)) }),

      setPromoCode: (code) => set({ promoCode: code }),

      setAppliedPromoCodes: (codes) =>
        set({
          appliedPromoCodes: [...new Set(codes.map((item) => item.trim().toUpperCase()).filter(Boolean))],
        }),

      removePromoCode: (code) =>
        set((state) => ({
          appliedPromoCodes: state.appliedPromoCodes.filter(
            (item) => item !== code.trim().toUpperCase(),
          ),
        })),

      clearPromoCode: () => set({ promoCode: '', appliedPromoCodes: [] }),

      addItem: (plant, quantity = 1, options) => {
        const variant = options.variant
        if (!variant?.id || !isProductVariantUuid(variant.id)) {
          console.error('[cart] addItem: valid variant id is required')
          return { added: 0, quantityInCart: 0, maxQuantity: 0, wasCapped: false }
        }

        const variantId = variant.id
        const unitPrice = options.unitPrice ?? variant.basePrice
        const maxQuantity = getPlantLineMaxQuantity(plant, variant)

        const items = normalizeCartItems(get().items)
        const inCartBefore = getCartLineQuantity(items, plant.id, variantId)
        const requestedTotal = inCartBefore + quantity
        const quantityInCart = Math.min(requestedTotal, maxQuantity)
        const added = Math.max(0, quantityInCart - inCartBefore)
        const wasCapped = requestedTotal > maxQuantity

        if (added > 0 || inCartBefore > 0) {
          const existingItem = items.find(
            (item) => item.plant.id === plant.id && item.variantId === variantId
          )

          const nextItems = existingItem
            ? items.map((item) =>
                item.plant.id === plant.id && item.variantId === variantId
                  ? { ...item, quantity: quantityInCart, unitPrice, variantLabel: variant.label }
                  : item
              )
            : [
                ...items,
                {
                  plant,
                  quantity: quantityInCart,
                  variantId,
                  variantLabel: variant.label,
                  unitPrice,
                },
              ]

          set({ items: normalizeCartItems(nextItems) })
        }

        return {
          added,
          quantityInCart: added > 0 || inCartBefore > 0 ? quantityInCart : inCartBefore,
          maxQuantity,
          wasCapped,
        }
      },

      removeItem: (plantId, variantId) => {
        set((state) => ({
          items: normalizeCartItems(
            state.items.filter(
              (item) => !(item.plant.id === plantId && item.variantId === variantId)
            )
          ),
        }))
      },

      updateQuantity: (plantId, quantity, variantId) => {
        if (!variantId) return

        if (quantity <= 0) {
          get().removeItem(plantId, variantId)
          return
        }

        set((state) => ({
          items: normalizeCartItems(
            state.items.map((item) => {
              if (item.plant.id !== plantId || item.variantId !== variantId) return item
              const variant = findVariantOnPlant(item.plant, variantId)
              if (!variant) return item
              const maxQuantity = getPlantLineMaxQuantity(item.plant, variant)
              return { ...item, quantity: Math.min(quantity, maxQuantity) }
            })
          ),
        }))
      },

      clearCart: () => set({ items: [], promoCode: '', appliedPromoCodes: [] }),

      replaceItems: (items) => set({ items: normalizeCartItems(items) }),

      setServerSyncPaused: (paused) => set({ serverSyncPaused: paused }),

      setHasHydratedFromServer: (hydrated) => set({ hasHydratedFromServer: hydrated }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCartOpen: (open) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      refreshCatalogData: async () => {
        const current = get().items
        if (!current.length) return
        const refreshed = await refreshCartItemPlants(current)
        set({ items: normalizeCartItems(refreshed) })
      },

      getTotalItems: () => computeCartTotalItems(get().items),
      getTotalPrice: () =>
        computeCartTotalPrice(get().items, get().personalDiscountPercent),
    }),
    {
      name: 'zeleni-yanholy-cart',
      version: CART_STORAGE_VERSION,
      partialize: (state) => ({
        promoCode: state.promoCode,
        appliedPromoCodes: state.appliedPromoCodes,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...mergePersistedCart(persisted),
        items: [],
        isOpen: false,
        serverSyncPaused: false,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        useCartStore.setState({
          items: [],
          promoCode: state.promoCode ?? '',
          appliedPromoCodes: state.appliedPromoCodes ?? [],
          serverSyncPaused: false,
        })
      },
    }
  )
)

/** Позиції вже нормалізовані при записі в store — не викликайте normalize у селекторі. */
export function useCartItems() {
  return useCartStore((s) => s.items)
}

export function useCartIsOpen() {
  return useCartStore((s) => s.isOpen)
}

export function useCartSubtotal() {
  return useCartStore((s) => computeCartSubtotal(s.items))
}

export function useCartPersonalDiscountPercent() {
  return useCartStore((s) => s.personalDiscountPercent)
}

export function useCartTotalPrice() {
  return useCartStore((s) =>
    computeCartTotalPrice(s.items, s.personalDiscountPercent)
  )
}

export function useCartTotalItems() {
  return useCartStore((s) => computeCartTotalItems(s.items))
}

export function useCartCheckoutableItems() {
  return useCartStore((s) => getInStockCartItems(s.items))
}

export function useCartHasCheckoutableItems() {
  return useCartStore((s) => getInStockCartItems(s.items).length > 0)
}

export function useCartLineQuantity(plantId: string, variantId: string) {
  return useCartStore((s) => getCartLineQuantity(s.items, plantId, variantId))
}

export function useCartPromoCode() {
  return useCartStore((s) => s.promoCode)
}

export function useCartAppliedPromoCodes() {
  return useCartStore((s) => s.appliedPromoCodes)
}

/** @deprecated використовуйте useCartAppliedPromoCodes */
export function useCartAppliedPromoCode() {
  return useCartStore((s) => s.appliedPromoCodes[0] ?? '')
}

export function useCartActions() {
  return useCartStore(
    useShallow((s) => ({
      addItem: s.addItem,
      removeItem: s.removeItem,
      updateQuantity: s.updateQuantity,
      clearCart: s.clearCart,
      openCart: s.openCart,
      closeCart: s.closeCart,
      setCartOpen: s.setCartOpen,
      toggleCart: s.toggleCart,
      replaceItems: s.replaceItems,
      setServerSyncPaused: s.setServerSyncPaused,
      refreshCatalogData: s.refreshCatalogData,
      setPersonalDiscountPercent: s.setPersonalDiscountPercent,
      setPromoCode: s.setPromoCode,
      setAppliedPromoCodes: s.setAppliedPromoCodes,
      removePromoCode: s.removePromoCode,
      clearPromoCode: s.clearPromoCode,
    }))
  )
}
