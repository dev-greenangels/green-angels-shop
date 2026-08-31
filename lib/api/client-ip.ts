function clientIpFromRequest(request: Request): string | undefined {
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || undefined
}

export { clientIpFromRequest }
