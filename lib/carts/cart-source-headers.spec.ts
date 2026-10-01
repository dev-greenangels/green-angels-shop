/**
 * Pure unit tests for Cart BFF host/country/locale helpers.
 * Duplicates logic from cart-source-headers.ts without server-only import.
 */
import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'

import {
  parseCountryHostMap,
  resolveCountryFromHost,
} from '../../../green-angels-shop/lib/country-sites/resolve-country-host'
import { SUPPORTED_LOCALES } from '../../../green-angels-shop/lib/i18n/locales'

function normalizeSourceHost(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let host = raw.trim().toLowerCase()
  host = host.replace(/^https?:\/\//, '')
  host = host.split('/')[0]?.split('?')[0]?.split('#')[0] ?? ''
  host = host.split(',')[0]?.trim() ?? ''
  if (host.includes(':') && !host.startsWith('[')) {
    host = host.split(':')[0] ?? ''
  }
  if (host.startsWith('www.')) host = host.slice(4)
  if (!host || host.length > 253) return null
  return host
}

function resolveTrustedSourceHost(input: {
  host?: string | null
  xForwardedHost?: string | null
  countryHostsEnv: string
}): string | null {
  const map = parseCountryHostMap(input.countryHostsEnv)
  const known = new Set<string>()
  for (const h of map.keys()) {
    known.add(h)
    if (h.startsWith('www.')) known.add(h.slice(4))
    else known.add(`www.${h}`)
  }
  const isKnown = (h: string | null) =>
    Boolean(h && (known.has(h) || known.has(`www.${h}`)))
  const host = normalizeSourceHost(input.host)
  const xfh = normalizeSourceHost(input.xForwardedHost)
  if (isKnown(host)) return host
  if (isKnown(xfh)) return xfh
  return host
}

function resolvePageLocale(raw: string | null | undefined): string | null {
  const locale = raw?.trim().toLowerCase()
  if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale as never)) {
    return null
  }
  return locale
}

describe('Cart BFF host/country/locale helpers', () => {
  const env =
    'green-angels.sk:sk,www.green-angels.sk:sk,green-angels.at:at,www.green-angels.at:at,green-angels.hu:hu,www.green-angels.hu:hu'

  it('F: normalizes www / case / port', () => {
    assert.equal(normalizeSourceHost('https://WWW.green-angels.sk:443/path'), 'green-angels.sk')
    assert.equal(normalizeSourceHost('localhost:3000'), 'localhost')
  })

  it('C: Host wins over spoofed XFH to another storefront', () => {
    const host = resolveTrustedSourceHost({
      host: 'green-angels.sk',
      xForwardedHost: 'green-angels.at',
      countryHostsEnv: env,
    })
    assert.equal(host, 'green-angels.sk')
    assert.equal(resolveCountryFromHost(host!, parseCountryHostMap(env)), 'sk')
  })

  it('D: known hosts map to country sites', () => {
    const map = parseCountryHostMap(env)
    assert.equal(resolveCountryFromHost('green-angels.sk', map), 'sk')
    assert.equal(resolveCountryFromHost('green-angels.at', map), 'at')
    assert.equal(resolveCountryFromHost('green-angels.hu', map), 'hu')
  })

  it('E: unknown / localhost does not invent production origin', () => {
    const host = resolveTrustedSourceHost({
      host: 'localhost:3000',
      xForwardedHost: 'evil.example',
      countryHostsEnv: env,
    })
    assert.equal(host, 'localhost')
    assert.equal(resolveCountryFromHost(host!, parseCountryHostMap(env)), null)
  })

  it('proxy case: unknown Host + known XFH uses XFH', () => {
    const host = resolveTrustedSourceHost({
      host: 'internal.cluster.local',
      xForwardedHost: 'green-angels.hu',
      countryHostsEnv: env,
    })
    assert.equal(host, 'green-angels.hu')
  })

  it('A: page locale validated; cookie not involved', () => {
    assert.equal(resolvePageLocale('de'), 'de')
    assert.equal(resolvePageLocale('sk'), 'sk')
    assert.equal(resolvePageLocale('xx'), null)
  })

  it('spoofed production XFH on localhost is accepted only as DX edge (documented)', () => {
    // Host not known → known XFH wins. Local attackers can claim production attribution.
    const host = resolveTrustedSourceHost({
      host: 'localhost',
      xForwardedHost: 'green-angels.sk',
      countryHostsEnv: env,
    })
    assert.equal(host, 'green-angels.sk')
  })
})
