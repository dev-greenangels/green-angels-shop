/** Зняти блокування скролу/дотиків після закриття Radix Sheet (без observer). */
export function clearBodyScrollLock() {
  if (typeof document === 'undefined') return
  document.body.style.pointerEvents = ''
  document.body.style.overflow = ''
  document.body.removeAttribute('data-scroll-locked')
}
