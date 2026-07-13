import { toast } from '@/lib/toast'

export function showAddedToCartToast(
  message: string,
  plantName: string,
  variantLabel: string,
) {
  toast.success(message, {
    description: `${plantName} · ${variantLabel}`,
    classNames: {
      description: 'text-xs text-muted-foreground/90',
    },
  })
}
