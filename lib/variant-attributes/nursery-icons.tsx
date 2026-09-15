import Image from 'next/image'

import { cn } from '@/lib/utils'

type IconProps = {
  className?: string
}

/**
 * Decorative nursery attribute icons. Adjacent visible labels communicate meaning;
 * empty alt avoids leaking hardcoded Ukrainian into EU DOM while staying accessible
 * when the parent marks the icon aria-hidden.
 */
function NurseryIcon({
  src,
  className,
}: IconProps & {
  src: string
}) {
  return (
    <Image
      src={src}
      alt=""
      width={208}
      height={208}
      className={cn('object-contain', className)}
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
