import Image from 'next/image'

import { cn } from '@/lib/utils'

type AboutImageProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function AboutImage({ src, alt, className, priority }: AboutImageProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-secondary', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  )
}

type AboutVideoEmbedProps = {
  src: string
  title: string
  className?: string
}

export function AboutVideoEmbed({ src, title, className }: AboutVideoEmbedProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm',
        className,
      )}
    >
      <div className="aspect-video">
        <iframe
          title={title}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  )
}
