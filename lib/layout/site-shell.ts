/**
 * Єдиний клас оболонки контенту на всьому сайті.
 * max-width і горизонтальні відступи — у `app/globals.css` (`--site-shell-*`).
 */
export const siteContentShellClassName = 'site-shell'

/** Вужчий вміст (статті блогу, довгі текстові сторінки). */
export const siteContentShellNarrowClassName = 'site-shell site-shell--narrow'

/** Компактна сторінка (особистий кабінет). */
export const siteContentShellCompactClassName = 'site-shell site-shell--compact'

/** Sticky-панель: на мобільному фон від краю до краю екрана, тінь як у хедері. */
export const siteStickyToolbarOuterClassName =
  'sticky top-[var(--site-header-offset,2.75rem)] z-40 -mx-[var(--site-shell-padding-x)] mb-6 border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:mx-0'

export const siteStickyToolbarInnerClassName =
  'flex items-center gap-2 px-[var(--site-shell-padding-x)] py-2 md:px-2'

/** Правий кластер кнопок поверх горизонтального скролу чіпсів. */
export const siteStickyToolbarControlsClusterClassName =
  'relative z-10 flex h-8 shrink-0 items-center gap-2 bg-background/95 shadow-[-10px_0_14px_-6px_rgba(0,0,0,0.12)]'
