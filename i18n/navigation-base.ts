import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/** Single shared navigation instance — imported by server navigation.ts and client link.tsx. */
export const navigation = createNavigation(routing)
