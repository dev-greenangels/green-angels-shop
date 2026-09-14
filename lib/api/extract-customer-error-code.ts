/** Extract stable customer error code from Nest JSON bodies. */

export function extractCustomerErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (typeof record.code === 'string' && record.code.trim()) return record.code.trim()
  const message = record.message
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    const nested = message as Record<string, unknown>
    if (typeof nested.code === 'string' && nested.code.trim()) return nested.code.trim()
  }
  return null
}
