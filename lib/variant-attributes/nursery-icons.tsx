import { cn } from '@/lib/utils'

type IconProps = {
  className?: string
}

/**
 * Decorative nursery attribute icons (static PNGs under /public/images/attribute-icons).
 *
 * Use a plain <img> — not next/image. These are tiny UI marks; the optimizer
 * (Content-Disposition: attachment, AVIF pipeline) made them disappear or look
 * blank at 14–40px in product/cart/review/backstage surfaces.
 *
 * Adjacent visible labels communicate meaning; empty alt + parent aria-hidden
 * keeps them decorative without leaking hardcoded copy into the DOM.
 */
function NurseryIcon({
  src,
  className,
}: IconProps & {
  src: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static UI glyph; next/image breaks these marks
    <img
      src={src}
      alt=""
      width={208}
      height={208}
      decoding="async"
      draggable={false}
      className={cn('block object-contain', className)}
    />
  )
}

export function TrunkGirthIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/trunk-girth.png" {...props} />
}

export function StandardStemIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/standard-stem.png" {...props} />
}

export function ContainerIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/container.png" {...props} />
}

export function RootBallIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/root-ball.png" {...props} />
}

export function CrownDiameterIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/crown-diameter.png" {...props} />
}

export function LeafColorIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/leaf-color.png" {...props} />
}

export function FlowerColorIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/flower-color.png" {...props} />
}

export function AgeIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/age.png" {...props} />
}
