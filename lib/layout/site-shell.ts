/**
 * Єдиний клас оболонки контенту на всьому сайті.
 * max-width і горизонтальні відступи — у `app/globals.css` (`--site-shell-*`).
 */
export const siteContentShellClassName = 'site-shell'

/** Вужчий вміст (статті блогу, довгі текстові сторінки). */
export const siteContentShellNarrowClassName = 'site-shell site-shell--narrow'

/** Компактна сторінка (особистий кабінет). */
export const siteContentShellCompactClassName = 'site-shell site-shell--compact'

/** Sticky-панель каталогу: та сама ширина/відступи, що й плаваючий хедер; -2px щоб прилипала без просвіту. */
export const siteStickyToolbarOuterClassName =
  'sticky top-[calc(var(--site-header-offset,5rem)-2px)] z-40 -mx-[var(--site-shell-padding-x)] mb-6 px-3 sm:px-4'

export const siteStickyToolbarInnerClassName =
  'boty-glass flex items-center gap-2 rounded-b-[0.5rem] px-2.5 py-2 sm:px-3'

/** Правий кластер кнопок поверх горизонтального скролу чіпсів. */
export const siteStickyToolbarControlsClusterClassName =
  'relative z-10 flex h-8 shrink-0 items-center gap-2 boty-glass-match shadow-[-10px_0_14px_-6px_rgba(0,0,0,0.12)]'
