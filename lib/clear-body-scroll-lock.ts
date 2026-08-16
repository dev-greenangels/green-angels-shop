/** Зняти блокування скролу/дотиків і aria-hidden після закриття Radix Sheet. */
export function clearBodyScrollLock() {
  if (typeof document === 'undefined') return
  document.body.style.pointerEvents = ''
  document.body.style.overflow = ''
  document.body.removeAttribute('data-scroll-locked')

  // Якщо Sheet розмонтували, поки він був open — Radix лишає маркери на siblings.
  document.querySelectorAll('[data-aria-hidden="true"]').forEach((el) => {
    el.removeAttribute('data-aria-hidden')
    el.removeAttribute('aria-hidden')
  })
}
