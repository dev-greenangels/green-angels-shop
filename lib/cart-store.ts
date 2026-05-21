'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plant, CartItem, ProductVariant } from './types'

export function cartLineKey(plantId: string, variantId?: string) {
  return variantId ? `${plantId}:${variantId}` : plantId
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (
    plant: Plant,
    quantity?: number,
    options?: {
      variant?: ProductVariant
      unitPrice?: number
    }
  ) => void
  removeItem: (plantId: string, variantId?: string) => void
  updateQuantity: (plantId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  setCartOpen: (open: boolean) => void
  toggleCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (plant, quantity = 1, options) => {
        const variant = options?.variant
        const variantId = variant?.id
        const unitPrice = options?.unitPrice ?? variant?.basePrice ?? plant.price

        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.plant.id === plant.id &&
              (item.variantId ?? undefined) === (variantId ?? undefined)
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.plant.id === plant.id &&
                (item.variantId ?? undefined) === (variantId ?? undefined)
                  ? { ...item, quantity: item.quantity + quantity, unitPrice }
                  : item
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                plant,
                quantity,
                variantId,
                variantLabel: variant?.label,
                unitPrice,
              },
            ],
          }
        })
      },

      removeItem: (plantId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => cartLineKey(item.plant.id, item.variantId) !== cartLineKey(plantId, variantId)
          ),
        }))
      },

      updateQuantity: (plantId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(plantId, variantId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            cartLineKey(item.plant.id, item.variantId) === cartLineKey(plantId, variantId)
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCartOpen: (open) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.unitPrice ?? item.plant.price
          return total + price * item.quantity
        }, 0)
      },
    }),
    {
      name: 'zeleni-yanholy-cart',
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Pick<CartStore, 'items'>),
        isOpen: false,
      }),
    }
  )
)
