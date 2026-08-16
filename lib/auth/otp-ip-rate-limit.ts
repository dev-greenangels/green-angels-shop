const DEFAULT_SEND_MAX = 20
const DEFAULT_VERIFY_MAX = 60
const DEFAULT_HINT_MAX = 30
const DEFAULT_WINDOW_SEC = 900

type LimitKind = 'send' | 'verify' | 'hint'

type WindowState = {
  count: number
  resetAt: number
}

const windows = new Map<string, WindowState>()

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function maxFor(kind: LimitKind): number {
  if (kind === 'hint') return readPositiveInt('OTP_IP_HINT_MAX', DEFAULT_HINT_MAX)
  return kind === 'send'
    ? readPositiveInt('OTP_IP_SEND_MAX', DEFAULT_SEND_MAX)
    : readPositiveInt('OTP_IP_VERIFY_MAX', DEFAULT_VERIFY_MAX)
}

function windowMsFor(kind: LimitKind): number {
  const sec =
    kind === 'hint'
      ? readPositiveInt('OTP_IP_HINT_WINDOW_SEC', DEFAULT_WINDOW_SEC)
      : kind === 'send'
        ? readPositiveInt('OTP_IP_SEND_WINDOW_SEC', DEFAULT_WINDOW_SEC)
        : readPositiveInt('OTP_IP_VERIFY_WINDOW_SEC', DEFAULT_WINDOW_SEC)
  return sec * 1000
}

/** Best-effort IP from the incoming Next request. Not treated as spoof-proof. */
export function readBrowserIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

export function consumeOtpIpLimit(kind: LimitKind, ip: string, now = Date.now()): boolean {
  const key = `otp:ip:${kind}:${ip.trim() || 'unknown'}`
  const max = maxFor(kind)
  const windowMs = windowMsFor(kind)
  const current = windows.get(key)
  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (current.count >= max) return false
  current.count += 1
  return true
}
