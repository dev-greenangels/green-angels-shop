export function safeBackstageRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/backstage'
  if (!path.startsWith('/backstage') || path.startsWith('/backstage/login')) {
    return '/backstage'
  }
  return path
}
