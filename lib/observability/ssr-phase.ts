import { resolveSsrRequestId } from '@/lib/api/ssr-request-id'

/** Measure an SSR phase without changing control flow. */
export async function timeSsrPhase<T>(phase: string, run: () => Promise<T>): Promise<T> {
  const started = performance.now()
  try {
    return await run()
  } finally {
    const ms = Math.round(performance.now() - started)
    console.info(`[ssr-phase] ${resolveSsrRequestId()} ${phase} ${ms}ms`)
  }
}
