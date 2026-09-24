'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchPacketaCarriers,
  type PacketaCarrier,
  type PacketaCarriersFeedResult,
} from '@/lib/backstage/packeta'

const PRIORITY_COUNTRIES = ['SK', 'CZ', 'HU', 'AT', 'DE'] as const

function yn(value: boolean | null | undefined): string {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return '—'
}

function CarrierTable({ rows }: { rows: PacketaCarrier[] }) {
  if (!rows.length) {
    return <p className="text-xs text-muted-foreground">No services for this country.</p>
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border/70">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 font-medium">Name</th>
            <th className="px-2 py-1.5 font-medium">Nature</th>
            <th className="px-2 py-1.5 font-medium">Available</th>
            <th className="px-2 py-1.5 font-medium">COD</th>
            <th className="px-2 py-1.5 font-medium">Max kg</th>
            <th className="px-2 py-1.5 font-medium">Requires size</th>
            <th className="px-2 py-1.5 font-medium">Carrier ID</th>
            <th className="px-2 py-1.5 font-medium">BDS (diag.)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-border/60">
              <td className="px-2 py-1.5 font-medium text-foreground">{c.name}</td>
              <td className="px-2 py-1.5">
                {c.pickupPoints === true ? 'pickup / PUDO' : 'home delivery'}
              </td>
              <td className="px-2 py-1.5">{yn(c.available)}</td>
              <td className="px-2 py-1.5">
                {c.codAllowed === true ? 'allowed' : c.codAllowed === false ? 'not allowed' : '—'}
              </td>
              <td className="px-2 py-1.5">{c.maxWeightKg ?? '—'}</td>
              <td className="px-2 py-1.5">{yn(c.requiresSize)}</td>
              <td className="px-2 py-1.5 font-mono text-muted-foreground">{c.id}</td>
              <td className="px-2 py-1.5 text-muted-foreground">{c.bdsStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * READ-ONLY diagnostic: Packeta carrier/json for the configured account.
 * Not editable — does not affect checkout pricing or createPacket.
 */
export function PacketaCarriersDiagnosticSection() {
  const [data, setData] = useState<PacketaCarriersFeedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchPacketaCarriers({ refresh })
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Packeta carriers')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const otherCountries = useMemo(() => {
    if (!data?.byCountry) return []
    return Object.keys(data.byCountry)
      .filter((cc) => !(PRIORITY_COUNTRIES as readonly string[]).includes(cc))
      .sort()
  }, [data])

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Available Packeta services</CardTitle>
          <CardDescription>
            Read-only snapshot from Packeta <code className="text-xs">carrier/json</code>. Reference
            data only — does not change checkout prices, tariffs, or create shipments. BDS column is
            diagnostic (confirmed only for documented Packeta ids).
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => void load(true)}
        >
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading carriers…
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {data?.error ? <p className="text-sm text-amber-700 dark:text-amber-400">{data.error}</p> : null}
        {data ? (
          <p className="text-xs text-muted-foreground">
            {data.carriers.length} service(s)
            {data.fetchedAt ? ` · fetched ${data.fetchedAt}` : ''}
            {data.fromCache ? ' · cached' : ' · live'}
            {!data.configured ? ' · Packeta not configured' : ''}
          </p>
        ) : null}

        {PRIORITY_COUNTRIES.map((cc) => (
          <div key={cc} className="space-y-2">
            <p className="text-sm font-medium">{cc}</p>
            <CarrierTable rows={data?.byCountry?.[cc] ?? []} />
          </div>
        ))}

        {otherCountries.length > 0 ? (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <p className="text-sm font-medium">Other countries</p>
            {otherCountries.map((cc) => (
              <div key={cc} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{cc}</p>
                <CarrierTable rows={data?.byCountry?.[cc] ?? []} />
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
