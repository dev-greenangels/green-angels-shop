'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import {
  findVariantOnPlant,
  getCartLineQuantity,
  getPlantLineMaxQuantity,
} from '@/lib/cart-limits'
import {
  cartLineKey,
  normalizeCartItems,
  type PersistedCartState,
} from '@/lib/cart-normalize'
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

/** Версія схеми в localStorage — збільшуйте при зміні формату кошика. */
export const CART_STORAGE_VERSION = 1

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (plant: Plant, quantity: number | undefined, options: AddToCartOptions) => AddToCartResult
  removeItem: (plantId: string, variantId: string) => void
  updateQuantity: (plantId: string, quantity: number, variantId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  setCartOpen: (open: boolean) => void
  toggleCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export function computeCartTotalPrice(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const price = item.unitPrice ?? item.plant.price
    return total + price * item.quantity
  }, 0)
}

export function computeCartTotalItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

function mergePersistedCart(persisted: unknown): PersistedCartState {
  const state = persisted as PersistedCartState | undefined
  return { items: normalizeCartItems(state?.items ?? []) }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (plant, quantity = 1, options) => {
        const variant = options.variant
        if (!variant?.id) {
          console.error('[cart] addItem: variant is required')
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

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCartOpen: (open) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => computeCartTotalItems(get().items),
      getTotalPrice: () => computeCartTotalPrice(get().items),
    }),
    {
      name: 'zeleni-yanholy-cart',
      version: CART_STORAGE_VERSION,
      migrate: (persistedState) => mergePersistedCart(persistedState),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        ...mergePersistedCart(persisted),
        isOpen: false,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        useCartStore.setState({ items: normalizeCartItems(state.items) })
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

export function useCartTotalPrice() {
  return useCartStore((s) => computeCartTotalPrice(s.items))
}

export function useCartTotalItems() {
  return useCartStore((s) => computeCartTotalItems(s.items))
}

export function useCartLineQuantity(plantId: string, variantId: string) {
  return useCartStore((s) => getCartLineQuantity(s.items, plantId, variantId))
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
    }))
  )
}
