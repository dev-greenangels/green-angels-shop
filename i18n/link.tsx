'use client'

import { forwardRef, type ComponentProps } from 'react'

import { navigation } from './navigation-base'

const IntlLink = navigation.Link

type IntlLinkProps = ComponentProps<typeof IntlLink>

/**
 * Storefront Link: default prefetch={false} for A/B experiment.
 * Explicit prefetch={true|false|null} still wins via `??`.
 */
export const Link = forwardRef<HTMLAnchorElement, IntlLinkProps>(function Link(props, ref) {
  const { prefetch, ...rest } = props
  return <IntlLink ref={ref} {...rest} prefetch={prefetch ?? false} />
})
