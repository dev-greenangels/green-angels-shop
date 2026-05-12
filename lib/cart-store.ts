'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plant, CartItem } from './types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (plant: Plant, quantity?: number) => void
  removeItem: (plantId: string) => void
  updateQuantity: (plantId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (plant: Plant, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.plant.id === plant.id)
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.plant.id === plant.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { plant, quantity }],
          }
        })
      },
      
      removeItem: (plantId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.plant.id !== plantId),
        }))
      },
      
      updateQuantity: (plantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(plantId)
          return
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.plant.id === plantId ? { ...item, quantity } : item
          ),
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.plant.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'zeleni-yanholy-cart',
    }
  )
)
