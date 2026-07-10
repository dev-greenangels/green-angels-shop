/** Легкий тактильний відгук на підтримуваних пристроях (переважно мобільні). */
export function triggerSelectionHaptic(durationMs = 12) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  navigator.vibrate(durationMs)
}
