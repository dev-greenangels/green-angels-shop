/** Запобігає відкритому редіректу після логіну. */
export function safeAuthRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  if (path.startsWith('/auth')) return '/'
  return path
}
