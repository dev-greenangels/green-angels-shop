'use client'

import { createNavigation } from 'next-intl/navigation'
import { forwardRef, type ComponentProps } from 'react'

import { routing } from './routing'

const { Link: IntlLink } = createNavigation(routing)

type IntlLinkProps = ComponentProps<typeof IntlLink>

/**
 * Storefront Link: default prefetch={false} for A/B experiment.
 * Explicit prefetch={true|false|null} still wins via `??`.
 */
export const Link = forwardRef<HTMLAnchorElement, IntlLinkProps>(function Link(props, ref) {
  const { prefetch, ...rest } = props
  return <IntlLink ref={ref} {...rest} prefetch={prefetch ?? false} />
})
