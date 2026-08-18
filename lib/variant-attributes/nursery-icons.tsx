import Image from 'next/image'

import { cn } from '@/lib/utils'

type IconProps = {
  className?: string
}

function NurseryIcon({
  src,
  alt,
  className,
}: IconProps & {
  src: string
  alt: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={208}
      height={208}
      className={cn('rounded-full object-cover', className)}
    />
  )
}

export function TrunkGirthIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/trunk-girth.png" alt="Обхват стовбура" {...props} />
}

export function StandardStemIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/standard-stem.png" alt="Висота штамба" {...props} />
}

export function ContainerIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/container.png" alt="Горщик (контейнер)" {...props} />
}

export function RootBallIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/root-ball.png" alt="Кореневий ком" {...props} />
}

export function CrownDiameterIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/crown-diameter.png" alt="Діаметр крони" {...props} />
}

export function LeafColorIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/leaf-color.png" alt="Колір листя" {...props} />
}

export function FlowerColorIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/flower-color.png" alt="Колір цвітіння" {...props} />
}

export function AgeIcon(props: IconProps) {
  return <NurseryIcon src="/images/attribute-icons/age.png" alt="Вік саджанця" {...props} />
}
