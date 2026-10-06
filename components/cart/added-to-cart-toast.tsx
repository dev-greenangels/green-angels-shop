'use client'

import { ShoppingCart } from 'lucide-react'

import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { toast } from '@/lib/toast'
import type { ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CART_TOAST_ATTR = 'data-cart-toast'
export const CART_TRIGGER_ATTR = 'data-cart-trigger'
export const CART_TOAST_ID = 'added-to-cart'

const CART_TOAST_DURATION_MS = 5500
const FLY_DURATION_MS = 480

let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
let outsideClickBound = false
let flying = false

type AddedToCartToastViewProps = {
  message: string
  plantName: string
  variantLabel: string
  actionLabel: string
  variant?: Pick<ProductVariant, 'displayAttributes'> | null
  onOpenCart: () => void
}

function AddedToCartToastView({
  message,
  plantName,
  variantLabel,
  actionLabel,
  variant,
  onOpenCart,
}: AddedToCartToastViewProps) {
  return (
    <div
      data-cart-toast=""
      className={cn(
        'pointer-events-auto flex w-[min(100vw-2rem,28rem)] items-start gap-3 rounded-xl',
        'bg-background/90 px-3.5 py-3 text-foreground shadow-lg backdrop-blur-md',
        'supports-[backdrop-filter]:bg-background/85',
      )}
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-primary">{message}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-snug">
          <span className="text-foreground/85">{plantName}</span>
          <VariantSizeLabel
            label={variantLabel}
            variant={variant}
            className="text-muted-foreground"
            textClassName="overflow-visible whitespace-normal text-clip"
            iconClassName="h-3.5 w-3.5 shrink-0 text-foreground/70"
          />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 gap-1 rounded-lg bg-primary-gradient px-2.5 text-xs text-primary-foreground"
        onPointerDown={(event) => {
          // Capture-phase outside-dismiss must not steal this interaction.
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpenCart()
        }}
      >
        <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        {actionLabel}
      </Button>
    </div>
  )
}

function clearAutoDismiss() {
  if (autoDismissTimer != null) {
    clearTimeout(autoDismissTimer)
    autoDismissTimer = null
  }
}

function scheduleAutoDismiss() {
  clearAutoDismiss()
  autoDismissTimer = setTimeout(() => {
    dismissCartToast({ fly: true })
  }, CART_TOAST_DURATION_MS)
}

function findCartToastElement(): HTMLElement | null {
  return document.querySelector(`[${CART_TOAST_ATTR}]`)
}

function findCartTriggerElement(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[${CART_TRIGGER_ATTR}]`)
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return node
  }
  return nodes[0] ?? null
}

function flyCartToastToCartIcon() {
  const source = findCartToastElement()
  const target = findCartTriggerElement()
  if (!source || !target || flying) return

  flying = true
  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const clone = source.cloneNode(true) as HTMLElement
  clone.removeAttribute(CART_TOAST_ATTR)
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '9999',
    pointerEvents: 'none',
    transition: `transform ${FLY_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${FLY_DURATION_MS}ms ease`,
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
  })
  document.body.appendChild(clone)
  source.style.opacity = '0'

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.12)`
    clone.style.opacity = '0'
  })

  window.setTimeout(() => {
    clone.remove()
    flying = false
  }, FLY_DURATION_MS + 40)
}

function unbindOutsideClick() {
  if (!outsideClickBound) return
  document.removeEventListener('pointerdown', onOutsidePointerDown, true)
  outsideClickBound = false
}

function onOutsidePointerDown(event: PointerEvent) {
  const toastEl = findCartToastElement()
  if (!toastEl) {
    unbindOutsideClick()
    return
  }
  if (event.target instanceof Node && toastEl.contains(event.target)) return
  dismissCartToast({ fly: true })
}

function bindOutsideClick() {
  if (outsideClickBound) return
  outsideClickBound = true
  window.setTimeout(() => {
    if (!outsideClickBound) return
    document.addEventListener('pointerdown', onOutsidePointerDown, true)
  }, 0)
}

export function dismissCartToast(options?: { fly?: boolean }) {
  clearAutoDismiss()
  unbindOutsideClick()
  if (options?.fly) {
    flyCartToastToCartIcon()
  }
  toast.dismiss(CART_TOAST_ID)
}

export function showAddedToCartToast(
  message: string,
  plantName: string,
  variantLabel: string,
  actionLabel: string,
  variant?: Pick<ProductVariant, 'displayAttributes'> | null,
) {
  toast.custom(
    () => (
      <AddedToCartToastView
        message={message}
        plantName={plantName}
        variantLabel={variantLabel}
        actionLabel={actionLabel}
        variant={variant}
        onOpenCart={() => {
          useCartStore.getState().openCart()
          dismissCartToast({ fly: false })
        }}
      />
    ),
    {
      id: CART_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      // Strip Sonner chrome so we don't get a double frame around the custom toast.
      classNames: {
        toast: '!pointer-events-auto !border-0 !bg-transparent !p-0 !shadow-none !ring-0',
      },
    },
  )

  scheduleAutoDismiss()
  bindOutsideClick()
}
