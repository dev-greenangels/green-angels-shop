import { Label } from '@/components/ui/label'

export const authInputClassName =
  'border-border/90 bg-background shadow-sm ring-1 ring-border/70 focus-visible:border-primary focus-visible:ring-primary/25'

export function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Label htmlFor={htmlFor} className="gap-0.5">
      {children}
      <span className="text-destructive" aria-hidden="true">
        {' '}
        *
      </span>
    </Label>
  )
}

export function FieldHint({
  id,
  show,
  message,
}: {
  id: string
  show: boolean
  message: string | null
}) {
  if (!show || !message) return null
  return (
    <p id={id} role="alert" className="text-xs leading-snug text-destructive">
      {message}
    </p>
  )
}
